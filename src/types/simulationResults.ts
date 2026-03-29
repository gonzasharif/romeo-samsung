export type SimulationResultsSection = {
  title: string | null
  content: string
}

export type SimulationResultsData = {
  productDescription: string
  summaryText: string
  sections: SimulationResultsSection[]
}
