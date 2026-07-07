Pod::Spec.new do |s|
  s.name           = 'Loc8Mesh'
  s.version        = '1.0.0'
  s.summary        = 'Loc8 BLE GATT mesh transport (bitchat v1 framing, dedup, TTL relay)'
  s.description    = 'Local Expo module: dual-role CoreBluetooth mesh carrying 25-byte Loc8 packets.'
  s.author         = 'Loc8'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
