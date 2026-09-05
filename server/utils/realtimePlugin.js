const { getIO } = require("./socketIO");

module.exports = function realtimePlugin(schema, options = {}) {
  const emitUpdate = (model, action, doc) => {
    try {
      if (!model) return;
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
    // If it's a subdocument, ignore to prevent duplicate events and avoid undefined modelName
    if (doc && typeof doc.$isSubdocument === "function" && doc.$isSubdocument()) {
      return;
    }
    if (doc && doc.ownerDocument && typeof doc.ownerDocument === "function") {
      return;
    }
    const modelName = (options && options.modelName) || (doc && doc.constructor && doc.constructor.modelName) || (this && this.constructor && this.constructor.modelName);
    if (modelName) {
      emitUpdate(modelName, "save", doc);
    }
  });

  schema.post("findOneAndUpdate", function(doc) {
    const modelName = (options && options.modelName) || (this && this.model && this.model.modelName) || (doc && doc.constructor && doc.constructor.modelName);
    if (doc && modelName) emitUpdate(modelName, "update", doc);
  });

  schema.post("findOneAndDelete", function(doc) {
    const modelName = (options && options.modelName) || (this && this.model && this.model.modelName) || (doc && doc.constructor && doc.constructor.modelName);
    if (doc && modelName) emitUpdate(modelName, "delete", doc);
  });
  
  schema.post("updateMany", function() {
    const modelName = (options && options.modelName) || (this && this.model && this.model.modelName);
    if (modelName) emitUpdate(modelName, "updateMany", null);
  });

  schema.post("deleteMany", function() {
    const modelName = (options && options.modelName) || (this && this.model && this.model.modelName);
    if (modelName) emitUpdate(modelName, "deleteMany", null);
  });
};

