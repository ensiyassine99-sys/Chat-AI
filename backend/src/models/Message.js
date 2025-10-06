const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Chat = require('./Chat');
const User = require('./User');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Chat,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null for AI messages
    references: {
      model: User,
      key: 'id',
    },
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true, // Only for AI messages
  },
  tokens: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  parentMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Chat,
      key: 'id',
    },
  },
  feedback: {
    type: DataTypes.ENUM('like', 'dislike'),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['chatId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = Message;