package utils

import (
	"fmt"
	"os"
)

type SupabaseClient struct {
	URL string
	Key string
}

var (
	SUPABASEURL = os.Getenv("SUPABASE_URL")
	SUPABASEKey = os.Getenv("SUPABASE_KEY")
	Supabase    = NewSupabaseClientFromEnv()
)

func NewSupabaseClient(url, key string) (*SupabaseClient, error) {
	if url == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}
	if key == "" {
		return nil, fmt.Errorf("SUPABASE_KEY is required")
	}

	return &SupabaseClient{
		URL: url,
		Key: key,
	}, nil
}

func NewSupabaseClientFromEnv() *SupabaseClient {
	client, err := NewSupabaseClient(SUPABASEURL, SUPABASEKey)
	if err != nil {
		return nil
	}

	return client
}
