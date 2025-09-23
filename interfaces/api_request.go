package interfaces

type SlaveRequestMatrixEntry struct {
	Type   SlaveRequestMatrixType
	Params string
}

type SlaveRequestOptions struct {
	Filter   string
	Matrices []SlaveRequestMatrixEntry
}

func (sro *SlaveRequestOptions) Clone() *SlaveRequestOptions {
	return &SlaveRequestOptions{
		Filter:   sro.Filter,
		Matrices: cloneSlice(sro.Matrices),
	}
}

type SlaveRequestBasics struct {
	ID        string
	Slave     string
	SlaveName string
	Invoker   string
	Version   string
}

func (srb *SlaveRequestBasics) Clone() *SlaveRequestBasics {
	return &SlaveRequestBasics{
		ID:        srb.ID,
		Slave:     srb.Slave,
		SlaveName: srb.SlaveName,
		Invoker:   srb.Invoker,
		Version:   srb.Version,
	}
}

type SlaveRequestNode struct {
	Name    string
	Payload string
}

func (srn *SlaveRequestNode) Clone() *SlaveRequestNode {
	return &SlaveRequestNode{
		Name:    srn.Name,
		Payload: srn.Payload,
	}
}

type SlaveRequestV1 struct {
	Basics  SlaveRequestBasics
	Options SlaveRequestOptions
	Configs SlaveRequestConfigsV1

	Vendor VendorType
	Nodes  []SlaveRequestNode

	RandomSequence string
	Challenge      string
}

func (sr *SlaveRequestV1) Clone() *SlaveRequestV1 {
	return &SlaveRequestV1{
		Basics:         *sr.Basics.Clone(),
		Options:        *sr.Options.Clone(),
		Configs:        *sr.Configs.Clone(),
		Nodes:          cloneSlice(sr.Nodes),
		RandomSequence: sr.RandomSequence,
		Challenge:      sr.Challenge,
	}
}

type SlaveRequest struct {
	Basics  SlaveRequestBasics
	Options SlaveRequestOptions
	Configs SlaveRequestConfigsV3

	Vendor VendorType
	Nodes  []SlaveRequestNode

	RandomSequence string
	Challenge      string
}

func (sr *SlaveRequest) Clone() *SlaveRequest {
	return &SlaveRequest{
		Basics:         *sr.Basics.Clone(),
		Options:        *sr.Options.Clone(),
		Configs:        *sr.Configs.Clone(),
		Nodes:          cloneSlice(sr.Nodes),
		RandomSequence: sr.RandomSequence,
		Challenge:      sr.Challenge,
	}
}

func (sr *SlaveRequest) CloneToV1() *SlaveRequestV1 {
	return &SlaveRequestV1{
		Basics:         *sr.Basics.Clone(),
		Options:        *sr.Options.Clone(),
		Configs:        *sr.Configs.CloneToV1(),
		Nodes:          cloneSlice(sr.Nodes),
		RandomSequence: sr.RandomSequence,
		Challenge:      sr.Challenge,
	}
}

type SlaveRequestV2 struct {
	Basics  SlaveRequestBasics
	Options SlaveRequestOptions
	Configs SlaveRequestConfigsV2

	Vendor VendorType
	Nodes  []SlaveRequestNode

	RandomSequence string
	Challenge      string
}

func (sr *SlaveRequestV2) Clone() *SlaveRequestV2 {
	return &SlaveRequestV2{
		Basics:         *sr.Basics.Clone(),
		Options:        *sr.Options.Clone(),
		Configs:        *sr.Configs.Clone(),
		Nodes:          cloneSlice(sr.Nodes),
		RandomSequence: sr.RandomSequence,
		Challenge:      sr.Challenge,
	}
}
func (sr *SlaveRequest) CloneToV2() *SlaveRequestV2 {
	return &SlaveRequestV2{
		Basics:         *sr.Basics.Clone(),
		Options:        *sr.Options.Clone(),
		Configs:        *sr.Configs.CloneToV2(),
		Nodes:          cloneSlice(sr.Nodes),
		RandomSequence: sr.RandomSequence,
		Challenge:      sr.Challenge,
	}
}
