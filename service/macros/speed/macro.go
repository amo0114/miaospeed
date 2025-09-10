package speed

import (
	"github.com/airportr/miaospeed/interfaces"
	"github.com/airportr/miaospeed/utils"
	"time"
)

type Speed struct {
	AvgSpeed  uint64
	MaxSpeed  uint64
	TotalSize uint64
	Speeds    []uint64
}

type UploadSpeed struct {
	AvgSpeed  uint64
	MaxSpeed  uint64
	TotalSize uint64
	Speeds    []uint64
}

func (m *Speed) Type() interfaces.SlaveRequestMacroType {
	return interfaces.MacroSpeed
}

func (m *Speed) Run(proxy interfaces.Vendor, r *interfaces.SlaveRequest) error {
	t1 := time.Now()
	Once(m, proxy, &r.Configs)
	t2 := time.Now()
	utils.DLogf("Speed macro took %s", t2.Sub(t1))
	return nil
}

func (m *UploadSpeed) Run(proxy interfaces.Vendor, r *interfaces.SlaveRequest) error {
	t1 := time.Now()
	UploadOnceChunked(m, proxy, &r.Configs)
	t2 := time.Now()
	utils.DLogf("UploadSpeed macro took %s", t2.Sub(t1))
	return nil
}

func (m *UploadSpeed) Type() interfaces.SlaveRequestMacroType {
	return interfaces.MacroUploadSpeed
}
