Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Meteor.subscribe("tasks");

  Template.body.helpers({
    tasks: function() {
      if (Session.get("hideCompleted")) {
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function() {
      return Session.get("hideCompleted");
    },
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task" : function (e) {
      var text = e.target.text.value;

      Meteor.call("addTask", text);

      e.target.text.value = "";

      return false;
    },
    "change .hide-completed input" : function (e) {
      Session.set("hideCompleted", e.target.checked);
    }
  });

  Template.task.created = function () {
    this._clicked = new ReactiveVar(false);
  }

  Template.task.events({
    "click .toggle-checked": function () {
      Meteor.call("setChecked", this._id, !this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, !this.private);
    },
    "click, .task": function (e, t) {
      t._clicked.set(!t._clicked.get())
    }
  });

  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
    testData: function () {
      return [1, 2, 3, 4, 5];
    },
    testData2: function () {
      return [1, 2, 3, 4, 5];
    },
    toggle: function () {
      console.log(Template.instance()._clicked.get())
      return Template.instance()._clicked.get() ? "toggle" : null;
    }
  })

  Template.toggle.created = function () {
    debugger;
  }

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addTask: function (text) {
    if(!Meteor.userId()) {
      throw new Meteor.Error("not-autorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);

    if(task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if(task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, {$set: {checked: setChecked}});
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    if(task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, {$set: {private: setToPrivate}});
  }
});

if (Meteor.isServer) {
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        {private: {$ne:true}},
        {owner: this.userId}
      ]
    });
  });
}
