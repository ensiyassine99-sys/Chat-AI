const sequelize = require('../config/database');
const User = require('./User');
const Chat = require('./Chat');
const Message = require('./Message');
const UserSummary = require('./UserSummary');

// Define associations
User.hasMany(Chat, {
    foreignKey: 'userId',
    as: 'chats',
    onDelete: 'CASCADE',
});

Chat.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Chat.hasMany(Message, {
    foreignKey: 'chatId',
    as: 'messages',
    onDelete: 'CASCADE',
});

Message.belongsTo(Chat, {
    foreignKey: 'chatId',
    as: 'chat',
});

Message.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

User.hasMany(Message, {
    foreignKey: 'userId',
    as: 'messages',
});

User.hasOne(UserSummary, {
    foreignKey: 'userId',
    as: 'summary',
    onDelete: 'CASCADE',
});

UserSummary.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// Self-referencing for message replies
Message.hasMany(Message, {
    as: 'replies',
    foreignKey: 'parentMessageId',
});

Message.belongsTo(Message, {
    as: 'parent',
    foreignKey: 'parentMessageId',
});


module.exports = {
    sequelize,  
    User,
    Chat,
    Message,
    UserSummary,
};