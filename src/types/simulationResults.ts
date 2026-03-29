export type SimulationResultsData = {
  productDescription: string
  pricePerception: number | null
  purchaseIntent: number | null
  demandSignal: number | null
  messageClarity: number | null
  insights: [string, string, string]
}
