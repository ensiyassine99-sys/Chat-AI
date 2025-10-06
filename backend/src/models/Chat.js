const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');


const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'New Chat',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'gemini-2.5-flash',
  },
  language: {
    type: DataTypes.ENUM('en', 'ar'),
    defaultValue: 'en',
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalTokens: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['isArchived'],
    },
    {
      fields: ['isPinned'],
    },
    {
      fields: ['lastMessageAt'],
    },
  ],
});

module.exports = Chat;