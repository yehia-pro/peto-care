// MongoDB Setup for Veterinary Chat System
// This script sets up the MongoDB collections for chat functionality

// Use the veterinary_chat database
use veterinary_chat;

// Create messages collection
db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["senderId", "receiverId", "content", "timestamp"],
      properties: {
        senderId: {
          bsonType: "string",
          description: "Sender user ID"
        },
        receiverId: {
          bsonType: "string",
          description: "Receiver user ID"
        },
        content: {
          bsonType: "string",
          description: "Message content"
        },
        timestamp: {
          bsonType: "date",
          description: "Message timestamp"
        },
        type: {
          enum: ["text", "image", "file", "system"],
          description: "Message type"
        },
        fileUrl: {
          bsonType: "string",
          description: "File URL if message contains file"
        },
        fileName: {
          bsonType: "string",
          description: "File name if message contains file"
        },
        read: {
          bsonType: "bool",
          description: "Whether message has been read"
        },
        readAt: {
          bsonType: "date",
          description: "When message was read"
        }
      }
    }
  }
});

// Create conversations collection
db.createCollection("conversations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participants", "lastMessage", "updatedAt"],
      properties: {
        participants: {
          bsonType: "array",
          minItems: 2,
          items: {
            bsonType: "string"
          },
          description: "Array of participant user IDs"
        },
        lastMessage: {
          bsonType: "object",
          required: ["content", "timestamp", "senderId"],
          properties: {
            content: {
              bsonType: "string"
            },
            timestamp: {
              bsonType: "date"
            },
            senderId: {
              bsonType: "string"
            }
          }
        },
        type: {
          enum: ["direct", "group"],
          description: "Conversation type"
        },
        groupName: {
          bsonType: "string",
          description: "Group name if conversation is a group chat"
        },
        createdAt: {
          bsonType: "date",
          description: "When conversation was created"
        },
        updatedAt: {
          bsonType: "date",
          description: "When conversation was last updated"
        }
      }
    }
  }
});

// Create notifications collection
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "title", "message", "timestamp"],
      properties: {
        userId: {
          bsonType: "string",
          description: "User ID who receives the notification"
        },
        type: {
          enum: ["message", "appointment", "payment", "system", "emergency"],
          description: "Notification type"
        },
        title: {
          bsonType: "string",
          description: "Notification title"
        },
        message: {
          bsonType: "string",
          description: "Notification message"
        },
        timestamp: {
          bsonType: "date",
          description: "When notification was created"
        },
        read: {
          bsonType: "bool",
          description: "Whether notification has been read"
        },
        readAt: {
          bsonType: "date",
          description: "When notification was read"
        },
        data: {
          bsonType: "object",
          description: "Additional data for the notification"
        }
      }
    }
  }
});

// Create chat rooms collection for group chats
db.createCollection("chatRooms", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "participants", "createdBy", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Chat room name"
        },
        description: {
          bsonType: "string",
          description: "Chat room description"
        },
        participants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["userId", "role"],
            properties: {
              userId: {
                bsonType: "string"
              },
              role: {
                enum: ["admin", "moderator", "member"]
              },
              joinedAt: {
                bsonType: "date"
              }
            }
          }
        },
        createdBy: {
          bsonType: "string",
          description: "User ID who created the room"
        },
        createdAt: {
          bsonType: "date",
          description: "When room was created"
        },
        isPrivate: {
          bsonType: "bool",
          description: "Whether room is private"
        },
        maxParticipants: {
          bsonType: "int",
          description: "Maximum number of participants"
        }
      }
    }
  }
});

// Create indexes for better performance
db.messages.createIndex({ "senderId": 1, "receiverId": 1, "timestamp": -1 });
db.messages.createIndex({ "receiverId": 1, "read": 1 });
db.messages.createIndex({ "timestamp": -1 });

db.conversations.createIndex({ "participants": 1, "updatedAt": -1 });
db.conversations.createIndex({ "updatedAt": -1 });

db.notifications.createIndex({ "userId": 1, "read": 1, "timestamp": -1 });
db.notifications.createIndex({ "timestamp": -1 });

db.chatRooms.createIndex({ "participants.userId": 1 });
db.chatRooms.createIndex({ "name": "text", "description": "text" });

// Insert sample data
db.messages.insertMany([
  {
    senderId: "admin-user-id",
    receiverId: "demo-user-id", 
    content: "Welcome to Veterinary Network! How can I help you today?",
    type: "text",
    timestamp: new Date(),
    read: false
  }
]);

db.conversations.insertOne({
  participants: ["admin-user-id", "demo-user-id"],
  type: "direct",
  lastMessage: {
    content: "Welcome to Veterinary Network! How can I help you today?",
    timestamp: new Date(),
    senderId: "admin-user-id"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB setup completed successfully!");
print("Collections created: messages, conversations, notifications, chatRooms");
print("Indexes created for optimal performance");