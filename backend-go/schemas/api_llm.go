package schemas

type StartModelRequest struct {
	ModelName    string `json:"model_name"`
	AgentContext string `json:"agent_context"`
	NGPULayers   *int   `json:"n_gpu_layers"`
	NCtx         *int   `json:"n_ctx"`
}

type AskModelRequest struct {
	Prompt string `json:"prompt"`
}

type CreatePeopleModelRequest struct {
	Prompt string `json:"prompt"`
}
