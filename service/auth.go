package service

import (
	"github.com/4thHydrogen/4th-nav/repository"
	"github.com/4thHydrogen/4th-nav/types"
	"github.com/4thHydrogen/4th-nav/utils"
)

func GetApiTokens() ([]types.Token, error) {
	return repository.GetActiveAPITokens()
}

func HasApiToken(token string) (bool, error) {
	return repository.ExistsActiveAPIToken(token)
}

func GetUser(name string) (types.User, error) {
	return repository.GetUserByName(name)
}

func AddApiTokenInDB(data types.Token) error {
	return repository.InsertAPIToken(data)
}

func DisableApiToken(id int) error {
	return repository.DisableAPIToken(id)
}

func UpdateUser(data types.UpdateUserDto) error {
	password := data.Password
	if !utils.IsBcryptHash(password) {
		hashed, err := utils.HashPassword(password)
		if err != nil {
			return err
		}
		password = hashed
	}

	return repository.UpdateUser(types.UpdateUserDto{
		Id:       data.Id,
		Name:     data.Name,
		Password: password,
	})
}
