// TrialMap — shows the trial's location on an OpenStreetMap, and the user's
// location relative to it, using Leaflet inside a WebView (no API key needed).
// Only renders when the trial has coordinates (LIVE data). Demo trials have no
// coordinates, so the parent screen does not show this component for them.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

interface Props {
  lat: number;
  lon: number;
  facility?: string | null;
  city?: string | null;
}

function haversineMiles(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function TrialMap({ lat, lon, facility, city }: Props) {
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') { setStatus('denied'); return; }
        const pos = await Location.getCurrentPositionAsync({});
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setStatus('ready');
      } catch {
        setStatus('denied');
      }
    })();
  }, []);

  const distance = userLoc ? haversineMiles(userLoc, [lat, lon]) : null;

  // Build a Leaflet HTML page. Markers: trial (teal) + user (blue) with a line.
  const userMarker = userLoc
    ? `var u=L.marker([${userLoc[0]},${userLoc[1]}]).addTo(map).bindPopup('You');
       L.polyline([[${userLoc[0]},${userLoc[1]}],[${lat},${lon}]],{color:'#0B5A5A',dashArray:'6'}).addTo(map);
       map.fitBounds([[${userLoc[0]},${userLoc[1]}],[${lat},${lon}]],{padding:[40,40]});`
    : `map.setView([${lat},${lon}],9);`;

  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>html,body,#map{height:100%;margin:0}</style>
    </head><body><div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map=L.map('map').setView([${lat},${lon}],10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
      L.marker([${lat},${lon}]).addTo(map).bindPopup(${JSON.stringify((facility || city || 'Trial site'))}).openPopup();
      ${userMarker}
    </script></body></html>`;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={
      `Map of the trial location${city ? ' in ' + city : ''}${distance != null ? `, about ${Math.round(distance)} miles from you` : ''}`
    }>
      <View style={styles.mapBox}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          scrollEnabled={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}><ActivityIndicator color="#0B5A5A" /></View>
          )}
        />
      </View>
      {status === 'loading' && <Text style={styles.note}>Finding your location…</Text>}
      {status === 'denied' && (
        <Text style={styles.note}>
          Location permission off — showing the trial site only. Turn on location to
          see the distance from you.
        </Text>
      )}
      {distance != null && (
        <Text style={styles.distance}>About {Math.round(distance)} miles from your location</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e4e4e4' },
  mapBox: { height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  note: { fontSize: 14, color: '#555', marginTop: 8, lineHeight: 20 },
  distance: { fontSize: 16, fontWeight: '600', color: '#0B5A5A', marginTop: 8 },
});
