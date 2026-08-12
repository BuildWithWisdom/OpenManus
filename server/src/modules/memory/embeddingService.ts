export class EmbeddingService {
  private dimension: number = 384;

  async generateEmbedding(text: string): Promise<number[]> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';
    const providerSlug = 'workers-ai';

    if (accountId && apiToken) {
      const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${providerSlug}/@cf/baai/bge-small-en-v1.5`;
      try {
        const response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-aig-authorization': `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ text: [text] }),
        });

        if (response.ok) {
          const payload = (await response.json()) as any;
          const vector = payload.result?.data?.[0] || payload.data?.[0]?.embedding;
          if (Array.isArray(vector) && vector.length > 0) {
            return vector;
          }
        }
      } catch (err) {
        console.warn('[EmbeddingService] Cloudflare Gateway call failed, using deterministic fallback embedding.');
      }
    }

    return this.generateDeterministicFallbackVector(text);
  }

  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateDeterministicFallbackVector(text: string): number[] {
    const vector = new Array(this.dimension).fill(0);
    const normalizedText = text.toLowerCase().trim();

    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const index = (charCode * (i + 1) * 31) % this.dimension;
      vector[index] += Math.sin(charCode + i);
    }

    let norm = 0;
    for (let i = 0; i < this.dimension; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1;

    return vector.map((val) => Number((val / norm).toFixed(6)));
  }
}

export const embeddingService = new EmbeddingService();
