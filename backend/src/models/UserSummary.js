const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserSummary = sequelize.define('UserSummary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  summaryAr: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  interests: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  topics: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  preferredModels: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  conversationStyle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statistics: {
    type: DataTypes.JSON,
    defaultValue: {
      totalChats: 0,
      totalMessages: 0,
      averageMessageLength: 0,
      mostActiveTime: null,
      favoriteModel: null,
      languageUsage: {
        en: 0,
        ar: 0,
      },
    },
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  generatedBy: {
    type: DataTypes.STRING(50),
    defaultValue: 'gemini-2.5-flash',
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['lastUpdated'],
    },
  ],
});

module.exports = UserSummary;