// backend/src/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      // ✅ NOUVELLE VALIDATION (accepte lettres, chiffres, espaces)
      is: {
        args: /^[a-zA-Z0-9\s]+$/,
        msg: 'Username must contain only letters, numbers, and spaces',
      },
      // Vérifier qu'il n'y a pas QUE des espaces
      notOnlySpaces(value) {
        if (value.trim().length === 0) {
          throw new Error('Username cannot be only spaces');
        }
      },
      // Vérifier qu'il n'y a pas d'espaces multiples
      noMultipleSpaces(value) {
        if (/\s{2,}/.test(value)) {
          throw new Error('Username cannot contain multiple consecutive spaces');
        }
      },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // NULL pour OAuth
    validate: {
      isValidPassword(value) {
        if (value === null || value === undefined) {
          if (this.provider === 'google') return;
          throw new Error('Password is required for local accounts');
        }
        if (value.length < 8 || value.length > 100) {
          throw new Error('Password must be between 8 and 100 characters');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw new Error('Password must contain uppercase, lowercase, and number');
        }
      }
    }
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  provider: {
    type: DataTypes.ENUM('local', 'google'),
    defaultValue: 'local',
    allowNull: false,
  },
  language: {
    type: DataTypes.ENUM('en', 'ar'),
    defaultValue: 'en',
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    defaultValue: 'light',
  },
  role: {
    type: DataTypes.ENUM('user', 'premium', 'admin'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetPasswordUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      notifications: true,
      emailNotifications: true,
      soundEnabled: true,
      autoSave: true,
    },
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && user.provider === 'local') {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password && user.provider === 'local') {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('This account uses OAuth. Please login with Google.');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isOAuthUser = function () {
  return this.provider !== 'local';
};

User.prototype.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

User.prototype.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.update({
      loginAttempts: 1,
      lockUntil: null,
    });
  }

  const updates = { loginAttempts: this.loginAttempts + 1 };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.lockUntil = new Date(Date.now() + lockTime);
  }

  return await this.update(updates);
};

User.prototype.resetLoginAttempts = async function () {
  return await this.update({
    loginAttempts: 0,
    lockUntil: null,
  });
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.emailVerificationToken;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  delete values.deletedAt;
  delete values.googleId;
  return values;
};

module.exports = User;