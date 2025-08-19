package main

import (
	"github.com/airportr/miaospeed/utils"
)

var COMPILATIONTIME string
var BUILDCOUNT string
var COMMIT string
var BRAND string
var VERSION string
var MihomoVersion string

func main() {
	PatchConstants()
	RunCli()
}

func PatchConstants() {
	utils.COMPILATIONTIME = COMPILATIONTIME
	utils.BUILDCOUNT = BUILDCOUNT
	utils.COMMIT = COMMIT
	utils.BRAND = BRAND
	if VERSION != "" {
		utils.VERSION = VERSION
	}
	if MihomoVersion != "" {
		utils.MihomoVersion = MihomoVersion
	}
}
