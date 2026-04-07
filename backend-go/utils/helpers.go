package utils

import (
	"encoding/json"
	"fmt"
	"time"

	"backend-go/models"
)

func CloneMap(input map[string]any) map[string]any {
	output := make(map[string]any, len(input))
	for key, value := range input {
		output[key] = value
	}
	return output
}

func DecodeInto(input map[string]any, target any) error {
	payload, err := json.Marshal(input)
	if err != nil {
		return err
	}

	return json.Unmarshal(payload, target)
}

func NormalizeString(raw any, fallback string) string {
	value, ok := raw.(string)
	if !ok || value == "" {
		return fallback
	}

	return value
}

func NormalizeTimestamp(raw any, fallback time.Time) string {
	switch value := raw.(type) {
	case nil:
		return fallback.Format(time.RFC3339)
	case string:
		if value == "" {
			return fallback.Format(time.RFC3339)
		}
		return value
	case time.Time:
		return value.UTC().Format(time.RFC3339)
	default:
		return fmt.Sprint(value)
	}
}

func NormalizeCompany(raw any) map[string]any {
	switch value := raw.(type) {
	case nil:
		return map[string]any{"name": "Empresa"}
	case string:
		var parsed map[string]any
		if err := json.Unmarshal([]byte(value), &parsed); err == nil && parsed != nil {
			if NormalizeString(parsed["name"], "") == "" {
				parsed["name"] = "Empresa"
			}
			return parsed
		}
		return map[string]any{"name": NormalizeString(value, "Empresa")}
	case map[string]any:
		company := CloneMap(value)
		if NormalizeString(company["name"], "") == "" {
			company["name"] = "Empresa"
		}
		return company
	default:
		return map[string]any{"name": fmt.Sprint(value)}
	}
}

func StringValue(value any) string {
	text, _ := value.(string)
	return text
}

func StringWithDefault(value any, fallback string) string {
	text := StringValue(value)
	if text == "" {
		return fallback
	}
	return text
}

func OptionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func MapValue(value any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	if typed, ok := value.(map[string]any); ok {
		return typed
	}
	return map[string]any{}
}

func StringSliceValue(value any, fallback string) []string {
	switch typed := value.(type) {
	case []string:
		if len(typed) > 0 {
			return typed
		}
	case []any:
		items := AnySliceToStrings(typed)
		if len(items) > 0 {
			return items
		}
	}

	if fallback == "" {
		return []string{}
	}
	return []string{fallback}
}

func AnySliceToStrings(items []any) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		if text := StringValue(item); text != "" {
			result = append(result, text)
		}
	}
	return result
}

func IntValue(value any) (int, bool) {
	switch typed := value.(type) {
	case int:
		return typed, true
	case int32:
		return int(typed), true
	case int64:
		return int(typed), true
	case float64:
		return int(typed), true
	default:
		return 0, false
	}
}

func TargetModelSliceValue(value any) []models.TargetModel {
	switch typed := value.(type) {
	case []models.TargetModel:
		return typed
	case []any:
		result := make([]models.TargetModel, 0, len(typed))
		for _, item := range typed {
			payload, ok := item.(map[string]any)
			if !ok {
				continue
			}
			var target models.TargetModel
			if err := DecodeInto(payload, &target); err == nil {
				result = append(result, target)
			}
		}
		return result
	default:
		return []models.TargetModel{}
	}
}

func NewUUID() string {
	now := time.Now().UTC().UnixNano()
	return fmt.Sprintf("%d", now)
}
