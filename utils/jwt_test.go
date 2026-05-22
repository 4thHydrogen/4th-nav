package utils

import (
	"testing"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/golang-jwt/jwt"
)

func TestSignAndParseJWT(t *testing.T) {
	user := types.User{Id: 1, Name: "admin"}
	token, err := SignJWT(user)
	if err != nil {
		t.Fatalf("SignJWT failed: %v", err)
	}
	if token == "" {
		t.Fatal("SignJWT returned empty token")
	}

	parsed, err := ParseJWT(token)
	if err != nil {
		t.Fatalf("ParseJWT failed: %v", err)
	}
	if !parsed.Valid {
		t.Fatal("Parsed token is not valid")
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("Failed to cast claims")
	}
	if claims["name"] != "admin" {
		t.Errorf("Expected name=admin, got %v", claims["name"])
	}
}

func TestParseJWT_InvalidToken(t *testing.T) {
	_, err := ParseJWT("invalid.token.here")
	if err == nil {
		t.Fatal("Expected error for invalid token, got nil")
	}
}

func TestIsBcryptHash(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", true},
		{"$2b$12$xyz", true},
		{"plaintext", false},
		{"", false},
	}
	for _, tt := range tests {
		result := IsBcryptHash(tt.input)
		if result != tt.expected {
			t.Errorf("IsBcryptHash(%q) = %v, want %v", tt.input, result, tt.expected)
		}
	}
}

func TestGenerateId(t *testing.T) {
	id := GenerateId()
	if id <= 0 {
		t.Error("GenerateId should return positive integer")
	}
}
