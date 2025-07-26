import { invoke } from '@tauri-apps/api/core';

export interface OllamaStatus {
    isInstalled: boolean;
    isRunning: boolean;
    version?: string;
    error?: string;
}

export interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

class OllamaService {
    private cachedStatus: OllamaStatus | null = null;
    private cacheTimeout: number = 30000; // 30 seconds
    private lastCheck: number = 0;

    /**
     * Check if Ollama is installed and running
     */
    async checkOllamaStatus(): Promise<OllamaStatus> {
        // Return cached result if recent
        const now = Date.now();
        if (this.cachedStatus && (now - this.lastCheck) < this.cacheTimeout) {
            return this.cachedStatus;
        }

        try {
            // First, check if Ollama binary exists by trying to get version
            const versionResult = await invoke('run_command', {
                command: 'ollama',
                args: ['--version']
            }) as { success: boolean; stdout: string; stderr: string };

            if (!versionResult.success) {
                this.cachedStatus = {
                    isInstalled: false,
                    isRunning: false,
                    error: 'Ollama is not installed'
                };
                this.lastCheck = now;
                return this.cachedStatus;
            }

            // Extract version from output (usually "ollama version 0.x.x")
            const version = versionResult.stdout.trim().replace('ollama version ', '');

            // Check if Ollama service is running by trying to list models
            try {
                const listResult = await invoke('run_command', {
                    command: 'ollama',
                    args: ['list']
                }) as { success: boolean; stdout: string; stderr: string };

                this.cachedStatus = {
                    isInstalled: true,
                    isRunning: listResult.success,
                    version: version,
                    error: listResult.success ? undefined : 'Ollama service is not running'
                };
            } catch (listError) {
                this.cachedStatus = {
                    isInstalled: true,
                    isRunning: false,
                    version: version,
                    error: 'Ollama service is not running'
                };
            }

            this.lastCheck = now;
            return this.cachedStatus;

        } catch (error) {
            this.cachedStatus = {
                isInstalled: false,
                isRunning: false,
                error: `Failed to check Ollama status: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            this.lastCheck = now;
            return this.cachedStatus;
        }
    }

    /**
     * Get list of available models
     */
    async getAvailableModels(): Promise<OllamaModel[]> {
        try {
            const result = await invoke('run_command', {
                command: 'ollama',
                args: ['list']
            }) as { success: boolean; stdout: string; stderr: string };

            if (!result.success) {
                throw new Error(result.stderr || 'Failed to list models');
            }

            // Parse the output to extract model information
            const lines = result.stdout.trim().split('\n');
            const models: OllamaModel[] = [];

            // Skip header line and parse each model line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 3) {
                        models.push({
                            name: parts[0],
                            size: this.parseSize(parts[1]),
                            modified_at: parts.slice(2).join(' ')
                        });
                    }
                }
            }

            return models;
        } catch (error) {
            throw new Error(`Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if a specific model is available
     */
    async isModelAvailable(modelName: string): Promise<boolean> {
        try {
            const models = await this.getAvailableModels();
            return models.some(model => model.name.includes(modelName));
        } catch {
            return false;
        }
    }

    /**
     * Get recommended models for summarization
     */
    getRecommendedModels(): string[] {
        return [
            'llama3.2:1b',
            'llama3.2:3b', 
            'llama3.1:8b',
            'phi3.5:3.8b',
            'qwen2.5:3b',
            'gemma2:2b'
        ];
    }

    /**
     * Pull a model from Ollama registry
     */
    async pullModel(modelName: string, onProgress?: (progress: string) => void): Promise<void> {
        try {
            const result = await invoke('run_command_with_progress', {
                command: 'ollama',
                args: ['pull', modelName],
                onProgress: onProgress
            }) as { success: boolean; stdout: string; stderr: string };

            if (!result.success) {
                throw new Error(result.stderr || 'Failed to pull model');
            }
        } catch (error) {
            throw new Error(`Failed to pull model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Test summarization with a model
     */
    async testSummarization(modelName: string, text: string): Promise<string> {
        try {
            const prompt = `Please provide a brief summary of the following text in 1-2 sentences:\n\n${text}`;
            
            const result = await invoke('run_command', {
                command: 'ollama',
                args: ['run', modelName, prompt]
            }) as { success: boolean; stdout: string; stderr: string };

            if (!result.success) {
                throw new Error(result.stderr || 'Failed to generate summary');
            }

            return result.stdout.trim();
        } catch (error) {
            throw new Error(`Failed to test summarization: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Clear cached status to force refresh
     */
    clearCache(): void {
        this.cachedStatus = null;
        this.lastCheck = 0;
    }

    /**
     * Parse size string (e.g., "1.2 GB") to bytes
     */
    private parseSize(sizeStr: string): number {
        const match = sizeStr.match(/^([\d.]+)\s*(GB|MB|KB|B)?$/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = (match[2] || 'B').toUpperCase();

        switch (unit) {
            case 'GB': return value * 1024 * 1024 * 1024;
            case 'MB': return value * 1024 * 1024;
            case 'KB': return value * 1024;
            default: return value;
        }
    }
}

export const ollamaService = new OllamaService();