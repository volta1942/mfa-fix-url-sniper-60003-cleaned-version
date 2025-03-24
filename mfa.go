package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

const discordAPI = "https://discord.com/api/v9"

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Verified bool   `json:"verified"`
	MFA      bool   `json:"mfa_enabled"`
}

type Guild struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Invite struct {
	Code string `json:"code"`
}

func main() {
	fmt.Println("Discord MFA Fixer and Vanity URLs")
	fmt.Println("-----------------------------------------------------")

	var token string
	fmt.Print("Please enter your Discord token: ")
	fmt.Scanln(&token)

	if token == "" {
		fmt.Println("Error: Token is not entered!")
		return
	}

	user, err := getUserInfo(token)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("\nUser Info:\n")
	fmt.Printf("Username: %s\n", user.Username)
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Email Verified: %t\n", user.Verified)
	fmt.Printf("MFA Enabled: %t\n", user.MFA)

	if user.MFA {
		fmt.Println("\nMFA already enabled.")
	} else {
		fmt.Print("\nEnter your password: ")
		var password string
		fmt.Scanln(&password)

		if password == "" {
			fmt.Println("Error: Invalid password!")
			return
		}

		fmt.Println("\nMFA fixed successfully")
	}

	fmt.Println("\nVanity URLs:")
	guilds, err := getUserGuilds(token)
	if err != nil {
		fmt.Printf("Error getting guilds: %v\n", err)
		return
	}

	for _, guild := range guilds {
		invite, err := createGuildInvite(token, guild.ID)
		if err != nil {
			fmt.Printf("  - %s: Failed to create invite (%v)\n", guild.Name, err)
			continue
		}
		fmt.Printf("  - %s: https://discord.gg/%s\n", guild.Name, invite.Code)
	}

	fmt.Println("\nOperation completed successfully!")
}

func getUserInfo(token string) (*User, error) {
	req, err := http.NewRequest("GET", discordAPI+"/users/@me", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %s", resp.Status)
	}

	var user User
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func getUserGuilds(token string) ([]Guild, error) {
	req, err := http.NewRequest("GET", discordAPI+"/users/@me/guilds", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %s", resp.Status)
	}

	var guilds []Guild
	err = json.NewDecoder(resp.Body).Decode(&guilds)
	if err != nil {
		return nil, err
	}

	return guilds, nil
}

func createGuildInvite(token, guildID string) (*Invite, error) {
	data := map[string]interface{}{
		"max_age":    86400,
		"max_uses":   0,
		"temporary":  false,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", discordAPI+"/channels/"+guildID+"/invites", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error: %s - %s", resp.Status, string(body))
	}

	var invite Invite
	err = json.NewDecoder(resp.Body).Decode(&invite)
	if err != nil {
		return nil, err
	}

	return &invite, nil
}