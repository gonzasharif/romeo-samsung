export type AgentFeedbackDetails = {
  name?: string
  purchase_interest?: string
  price_perception?: string
  recommendation_probability?: string
  comprehension?: {
    level?: string
    interpretation?: string
  }
  standout_feature?: string
  rejected_feature?: string
}

export type AgentFeedback = {
  User: string
  Feedback: AgentFeedbackDetails | string | any
}

export type SimulationResultsData = {
  productDescription: string
  agentFeedbacks?: AgentFeedback[]
  rawText?: string
}
