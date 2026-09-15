/**
 * Executa uma promise do Firestore com limite de tempo estrito (1500ms por padrao).
 * Evita que o app fique travado esperando timeouts longos (10s a 30s) da conexao gRPC/WebChannel.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 1500,
  errorMessage: string = "Firestore timeout"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
