// MiaoSpeed TypeScript Type Definitions

// Maps directly to Go structs in interfaces/ package



// ==================== Enums ====================



export type VendorType = 'Local' | 'Clash' | 'Invalid'



export type ProxyType =

  | 'Shadowsocks'

  | 'ShadowsocksR'

  | 'Snell'

  | 'Socks5'

  | 'Http'

  | 'Vmess'

  | 'Trojan'

  | 'Vless'

  | 'Hysteria'

  | 'Hysteria2'

  | 'TUIC'

  | 'Wireguard'

  | 'SSH'

  | 'Mieru'

  | 'AnyTLS'

  | 'Sudoku'

  | 'Masque'

  | 'Invalid'



export type SlaveRequestMatrixType =

  | 'SPEED_AVERAGE'

  | 'SPEED_MAX'

  | 'SPEED_PER_SECOND'

  | 'USPEED_AVERAGE'

  | 'USPEED_MAX'

  | 'USPEED_PER_SECOND'

  | 'UDP_TYPE'

  | 'GEOIP_INBOUND'

  | 'GEOIP_OUTBOUND'

  | 'TEST_SCRIPT'

  | 'TEST_PING_CONN'

  | 'TEST_PING_RTT'

  | 'TEST_PING_MAX_RTT'

  | 'TEST_PING_TOTAL_CONN'

  | 'TEST_PING_TOTAL_RTT'

  | 'TEST_PING_SD_RTT'

  | 'TEST_PING_SD_CONN'

  | 'TEST_HTTP_CODE'

  | 'TEST_PING_PACKET_LOSS'

  | 'TEST_HIJACK_DETECTION'

  | 'DEBUG_SLEEP'

  | 'INVALID'



export type ApiVersion = 0 | 1 | 2 | 3



// ==================== Request Types ====================



export interface SlaveRequestBasics {

  ID: string

  Slave: string

  SlaveName: string

  Invoker: string

  Version: string

}



export interface SlaveRequestMatrixEntry {

  Type: SlaveRequestMatrixType

  Params: string

}



export interface SlaveRequestOptions {

  Filter: string

  Matrices: SlaveRequestMatrixEntry[]

}



export interface Script {

  ID: string

  Type: 'media' | 'ip'

  Content: string

  TimeoutMillis: number

}



export interface SlaveRequestConfigs {

  ApiVersion: ApiVersion

  STUNURL: string

  DownloadURL: string

  DownloadDuration: number

  DownloadThreading: number

  UploadURL: string

  UploadDuration: number

  UploadThreading: number

  PingAverageOver: number

  PingAddress: string

  TaskRetry: number

  DNSServers: string[]

  TaskTimeout: number

  Scripts: Script[]

}



export interface SlaveRequestNode {

  Name: string

  Payload: string

}



export interface SlaveRequest {

  Basics: SlaveRequestBasics

  Options: SlaveRequestOptions

  Configs: SlaveRequestConfigs

  Vendor: VendorType

  Nodes: SlaveRequestNode[]

  RandomSequence: string

  Challenge: string

}



// ==================== Response Types ====================



export interface ProxyInfo {

  Name: string

  Address: string

  Type: ProxyType

}



export interface MatrixResponse {

  Type: SlaveRequestMatrixType

  Payload: string

}



export interface SlaveEntrySlot {

  Grouping: string

  ProxyInfo: ProxyInfo

  InvokeDuration: number

  Matrices: MatrixResponse[]

}



export interface SlaveTask {

  Request: SlaveRequest

  Results: SlaveEntrySlot[]

}



export interface SlaveProgress {

  Index: number

  Record: SlaveEntrySlot

  Queuing: number

}



export interface SlaveResponse {

  ID: string

  MiaoSpeedVersion: string

  Error: string

  Result: SlaveTask | null

  Progress: SlaveProgress | null

}



// ==================== Matrix Payload Types ====================



export interface SpeedPayload {

  Value: number // Bytes/s

}



export interface PerSecondSpeedPayload {

  Max: number

  Average: number

  Speeds: number[]

}



export interface PingPayload {

  Value: number // ms

}



export interface TotalPingPayload {

  Values: number[]

}



export interface PacketLossPayload {

  Value: number // 0.0-1.0

}



export interface HTTPCodePayload {

  Values: number[]

}



export interface UDPTypePayload {

  Value: string

}



export interface GeoInfo {

  organization: string

  longitude: number

  latitude: number

  timezone: string

  isp: string

  asn: number

  asn_organization: string

  country: string

  ip: string

  continent_code: string

  country_code: string

  stackType: string

}



export interface GeoIPPayload {

  Domain: string

  MainStack: GeoInfo | null

  IPv4Stack: GeoInfo[]

  IPv6Stack: GeoInfo[]

}



export interface HijackPayload {

  SpeedIP: string

  RealIP: string

}



export interface ScriptTestPayload {

  Key: string

  Text: string

  Color: string

  Background: string

  TimeElapsed: number

}



// ==================== Parsed Result Types ====================



export interface ParsedNodeResult {

  name: string

  address: string

  proxyType: ProxyType

  duration: number

  rtt: number | null

  httpPing: number | null

  downloadSpeed: number | null

  uploadSpeed: number | null

  packetLoss: number | null

  geoIP: GeoInfo | null

  udpType: string | null

  hijack: HijackPayload | null

  scriptResults: ScriptTestPayload[]

  matrices: MatrixResponse[]

}



// ==================== Config Types ====================



export interface MiaoSpeedConfig {

  serverUrl: string

  token: string

  buildToken: string

  path: string

  wsPath: string

}



export const DEFAULT_CONFIG: MiaoSpeedConfig = {

  serverUrl: 'ws://localhost:5173',

  token: '',

  buildToken: 'MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN',

  path: '/ws',

  wsPath: '/ws',

}



export const DEFAULT_REQUEST_CONFIGS: SlaveRequestConfigs = {

  ApiVersion: 3,

  STUNURL: '',

  DownloadURL: 'DYNAMIC:INTL',

  DownloadDuration: 3,

  DownloadThreading: 1,

  UploadURL: '',

  UploadDuration: 0,

  UploadThreading: 0,

  PingAverageOver: 1,

  PingAddress: '',

  TaskRetry: 3,

  DNSServers: [],

  TaskTimeout: 5000,

  Scripts: [],

}
