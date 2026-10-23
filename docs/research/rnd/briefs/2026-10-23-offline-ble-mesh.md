# Loc8 BLE mesh research, 23 October 2026

Review window: 17 to 23 October 2026. No verified new peer-reviewed BLE multi-hop publication superseded our previous research.

The strongest new source is BitChat Android PR #979, merged 22 October 2026. Its independent maintainers bounded packet queues and paced synchronisation. Their tests do not prove radio capacity. Source: https://github.com/permissionlesstech/bitchat-android/pull/979

BitChat Android PR #977 (22 October) demonstrated that batching rapid participant-list updates reduces UI stalls. This principle motivates a separate 100 ms status coalescer for our internal Consumer and Guard MESH-01 screen, without reducing native evidence collection. Source: https://github.com/permissionlesstech/bitchat-android/pull/977

Next: quantify native ingress/egress queue occupancy and saturation under real load, repeat frozen three-phone MESH-01 and background/locked cases, then measure dedicated BLE gateway and long-range bridging on hardware.

BitChat Android is GPL-3.0. No upstream code was imported. Loc8 retains its 25-byte payload, 47-byte frame, and current production relay default. This is experimental tooling, not venue-scale validation.
