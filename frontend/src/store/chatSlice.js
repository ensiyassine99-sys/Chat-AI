import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../services/chatService';

// Async thunks
export const fetchChatHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await chatService.getChatHistory(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchChat = createAsyncThunk(
  'chat/fetchChat',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await chatService.getChat(chatId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, model, chatId }, { rejectWithValue }) => {
    try {
      const response = await chatService.sendMessage({ message, model, chatId });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatId, { rejectWithValue }) => {
    try {
      await chatService.deleteChat(chatId);
      return chatId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  currentChat: null,
  messages: [],
  chats: [],
  totalChats: 0,
  isLoading: false,
  isSending: false,
  isTyping: false,
  error: null,
  selectedModel: 'gemini-2.5-flash',
  availableModels: [],
  page: 1,
  limit: 10,
};

// Chat slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
      state.messages = action.payload?.messages || [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    deleteMessage: (state, action) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    setAvailableModels: (state, action) => {
      state.availableModels = action.payload;
    },
    clearCurrentChat: (state) => {
      state.currentChat = null;
      state.messages = [];
    },
    updateChat: (state, action) => {
      const index = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = { ...state.chats[index], ...action.payload };
      }
      if (state.currentChat?.id === action.payload.id) {
        state.currentChat = { ...state.currentChat, ...action.payload };
      }
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch chat history
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload.chats;
        state.totalChats = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch chat history';
      });
    
    // Fetch single chat
    builder
      .addCase(fetchChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChat = action.payload.chat;
        state.messages = action.payload.chat.messages || [];
      })
      .addCase(fetchChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch chat';
      });
    
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        state.messages.push(action.payload.message);
        if (!state.currentChat) {
          state.currentChat = { id: action.payload.chatId };
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload?.message || 'Failed to send message';
      });
    
    // Delete chat
    builder
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter(chat => chat.id !== action.payload);
        if (state.currentChat?.id === action.payload) {
          state.currentChat = null;
          state.messages = [];
        }
      });
  },
});

export const {
  setCurrentChat,
  addMessage,
  updateMessage,
  deleteMessage,
  setTyping,
  setSelectedModel,
  setAvailableModels,
  clearCurrentChat,
  updateChat,
  setPage,
} = chatSlice.actions;

export default chatSlice.reducer;