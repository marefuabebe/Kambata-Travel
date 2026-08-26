const { getIO } = require("./socketIO");

module.exports = function realtimePlugin(schema, options) {
  const emitUpdate = (model, action, doc) => {
    try {
      const io = getIO();
      // Emit event to the admin_room
      io.to("admin_room").emit("db_change", { 
        model: model, 
        action: action, 
        id: doc ? doc._id : null 
      });
    } catch (e) {
      // socket.io might not be initialized during background cron jobs or tests
    }
  };

  schema.post("save", function(doc) {
    emitUpdate(options.modelName, "save", doc);
  });

  schema.post("findOneAndUpdate", function(doc) {
    if (doc) emitUpdate(options.modelName, "update", doc);
  });

  schema.post("findOneAndDelete", function(doc) {
    if (doc) emitUpdate(options.modelName, "delete", doc);
  });
  
  schema.post("updateMany", function() {
    emitUpdate(options.modelName, "updateMany", null);
  });
  schema.post("deleteMany", function() {
    emitUpdate(options.modelName, "deleteMany", null);
  });
};
