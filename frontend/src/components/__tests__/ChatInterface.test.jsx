import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import ChatInterface from '../chat/ChatInterface';
import store from '../../store/store';
import i18n from '../../config/i18n';

const renderWithProviders = (component) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('ChatInterface Component', () => {
  beforeEach(() => {
    // Reset store state
    store.dispatch({ type: 'chat/clearCurrentChat' });
  });
  
  test('renders chat interface', () => {
    renderWithProviders(<ChatInterface />);
    
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByText(/new chat/i)).toBeInTheDocument();
  });
  
  test('displays empty state when no messages', () => {
    renderWithProviders(<ChatInterface />);
    
    expect(screen.getByText(/start conversation/i)).toBeInTheDocument();
  });
  
  test('allows user to type message', () => {
    renderWithProviders(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    expect(input.value).toBe('Hello AI');
  });
  
  test('sends message on button click', async () => {
    renderWithProviders(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
  
  test('sends message on Enter key press', () => {
    renderWithProviders(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });
    
    expect(input.value).toBe('');
  });
  
  test('displays model selector', () => {
    renderWithProviders(<ChatInterface />);
    
    expect(screen.getByText(/select ai model/i)).toBeInTheDocument();
  });
  
  test('displays loading state when sending message', async () => {
    renderWithProviders(<ChatInterface />);
    
    // Mock loading state
    store.dispatch({ type: 'chat/sendMessage/pending' });
    
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });
});
