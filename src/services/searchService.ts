import api from './api';

export interface SearchResultMessage {
    id: string;
    content: string;
    chatId: number;
    authorId: number;
    timestamp: string;
}

const searchMessages = async (chatId: number, query: string): Promise<SearchResultMessage[]> => {
    try {
        const response = await api.get('/search', {
            params: {
                chatId,
                query,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to search messages', error);
        throw error;
    }
};

export default {
    searchMessages,
};
