package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init() error {
	exePath, err := os.Executable()
	var dbPath string
	if err != nil {
		log.Printf("Warning: cannot get executable path, using relative path: %v", err)
		dbPath = filepath.Join("..", "planing.db")
	} else {
		exeDir := filepath.Dir(exePath)
		dbPath = filepath.Join(exeDir, "..", "planing.db")
	}
	absPath, err := filepath.Abs(dbPath)
	if err != nil {
		log.Printf("Warning: cannot get absolute path, using relative: %v", err)
		absPath = dbPath
	}
	// Check if database file exists at absPath
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		// Try relative to current working directory
		cwd, err := os.Getwd()
		if err == nil {
			alternative := filepath.Join(cwd, "planing.db")
			if _, err := os.Stat(alternative); err == nil {
				absPath = alternative
				log.Printf("Database not found at %s, using %s", dbPath, absPath)
			} else {
				// Try one level up from cwd (for dev)
				alternative = filepath.Join(cwd, "..", "planing.db")
				if _, err := os.Stat(alternative); err == nil {
					absPath = alternative
					log.Printf("Database not found at %s, using %s", dbPath, absPath)
				}
			}
		}
	}
	log.Printf("Database path: %s", absPath)

	var errOpen error
	DB, errOpen = sql.Open("sqlite3", absPath)
	if errOpen != nil {
		return fmt.Errorf("failed to open database: %v", errOpen)
	}

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Database connection established")
	return nil
}

func GetDB() *sql.DB {
	return DB
}

func Close() error {
	return DB.Close()
}
