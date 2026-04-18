import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Credentials {
  clientId: string;
  clientSecret: string;
}

interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
}

interface FlightSegment {
  departure: {iataCode: string; at: string};
  arrival: {iataCode: string; at: string};
  carrierCode: string;
  number: string;
  numberOfStops: number;
}

interface FlightOffer {
  id: string;
  price: {total: string; currency: string};
  itineraries: Array<{
    duration: string;
    segments: FlightSegment[];
  }>;
}

type Screen = 'config' | 'search' | 'results';

// ─── Amadeus API helpers ──────────────────────────────────────────────────────

const BASE = 'https://test.api.amadeus.com';
let tokenCache: {value: string; expiry: number} | null = null;

async function getToken(id: string, secret: string): Promise<string> {
  if (tokenCache && tokenCache.expiry > Date.now()) return tokenCache.value;
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`,
  });
  const data = await res.json();
  if (!data.access_token)
    throw new Error(data.error_description || 'Authentication failed');
  tokenCache = {
    value: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.value;
}

async function searchAirports(query: string, token: string): Promise<Airport[]> {
  const res = await fetch(
    `${BASE}/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(query)}&page[limit]=6`,
    {headers: {Authorization: `Bearer ${token}`}},
  );
  const data = await res.json();
  return (data.data || []).map((loc: any) => ({
    iataCode: loc.iataCode,
    name: loc.name,
    cityName: loc.address?.cityName || loc.name,
  }));
}

async function searchFlights(
  origin: string,
  dest: string,
  date: string,
  token: string,
): Promise<FlightOffer[]> {
  const res = await fetch(
    `${BASE}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${dest}&departureDate=${date}&adults=1&max=5`,
    {headers: {Authorization: `Bearer ${token}`}},
  );
  const data = await res.json();
  if (data.errors) return [];
  return (data.data || []).sort(
    (a: FlightOffer, b: FlightOffer) =>
      parseFloat(a.price.total) - parseFloat(b.price.total),
  );
}

// ─── Utility functions ────────────────────────────────────────────────────────

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  return `${m[1] || '0'}h ${(m[2] || '0').padStart(2, '0')}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildGoogleFlightsUrl(
  origin: string,
  dest: string,
  date: string,
): string {
  const d = date.replace(/-/g, '');
  return `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}+on+${d}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlightCard({
  offer,
  highlight,
}: {
  offer: FlightOffer;
  highlight: boolean;
}) {
  const segs = offer.itineraries[0]?.segments ?? [];
  const first = segs[0];
  const last = segs[segs.length - 1];
  const stops = segs.length - 1;

  return (
    <View style={[styles.flightCard, highlight && styles.flightCardHighlight]}>
      {highlight && <Text style={styles.bestBadge}>BEST PRICE</Text>}
      <Text style={styles.flightPrice}>
        ${parseFloat(offer.price.total).toFixed(0)}
        <Text style={styles.flightCurrency}> {offer.price.currency}</Text>
      </Text>
      {first && last && (
        <Text style={styles.flightTimes}>
          {formatTime(first.departure.at)} → {formatTime(last.arrival.at)}
        </Text>
      )}
      <Text style={styles.flightMeta}>
        {formatDuration(offer.itineraries[0]?.duration ?? '')} ·{' '}
        {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
      </Text>
      {first && (
        <Text style={styles.flightCarrier}>
          {first.carrierCode} {first.number}
        </Text>
      )}
    </View>
  );
}

function OriginColumn({
  origin,
  label,
  color,
  flights,
  cheapestOther,
  dest,
  date,
}: {
  origin: string;
  label: string;
  color: string;
  flights: FlightOffer[];
  cheapestOther: number;
  dest: string;
  date: string;
}) {
  const cheapest = flights[0] ? parseFloat(flights[0].price.total) : Infinity;
  const isWinner = cheapest <= cheapestOther && flights.length > 0;

  return (
    <View style={styles.col}>
      <View style={[styles.originHeader, {backgroundColor: color}]}>
        {isWinner && <Text style={styles.winnerCrown}>👑</Text>}
        <Text style={styles.originCode}>{origin}</Text>
        <Text style={styles.originLabel}>{label}</Text>
      </View>

      {flights.length === 0 ? (
        <View style={styles.noResultsBox}>
          <Text style={styles.noResultsText}>No flights found</Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(buildGoogleFlightsUrl(origin, dest, date))
            }>
            <Text style={styles.googleLink}>Search on Google Flights →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        flights.map((offer, i) => (
          <FlightCard key={offer.id} offer={offer} highlight={i === 0 && isWinner} />
        ))
      )}
    </View>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function ConfigScreen({
  onSave,
}: {
  onSave: (c: Credentials) => void;
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const save = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      Alert.alert('Missing credentials', 'Please enter both API Key and Secret.');
      return;
    }
    onSave({clientId: clientId.trim(), clientSecret: clientSecret.trim()});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.configScroll}>
        <Text style={styles.appIcon}>✈️</Text>
        <Text style={styles.appName}>FlightComp</Text>
        <Text style={styles.appTagline}>
          Seattle vs Vancouver — find the cheapest departure
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amadeus API Credentials</Text>
          <Text style={styles.cardHint}>
            Sign up free at{' '}
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL('https://developers.amadeus.com/register')
              }>
              developers.amadeus.com
            </Text>
            {'\n'}Create an app → copy Client ID & Secret
          </Text>

          <Text style={styles.fieldLabel}>Client ID (API Key)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Paste your Client ID here"
            placeholderTextColor="#666"
            value={clientId}
            onChangeText={setClientId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Client Secret</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Paste your Client Secret here"
            placeholderTextColor="#666"
            value={clientSecret}
            onChangeText={setClientSecret}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={save}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          The test API covers popular routes. All prices are for reference only.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SearchScreen({
  credentials,
  onResults,
  onConfig,
}: {
  credentials: Credentials;
  onResults: (
    dest: Airport,
    date: string,
    sea: FlightOffer[],
    yvr: FlightOffer[],
  ) => void;
  onConfig: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSelectedAirport(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const token = await getToken(
          credentials.clientId,
          credentials.clientSecret,
        );
        setSuggestions(await searchAirports(text, token));
      } catch {
        // silently ignore suggestion errors
      }
    }, 400);
  };

  const handleSearch = async () => {
    if (!selectedAirport) {
      Alert.alert('Select destination', 'Pick an airport from the list.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken(
        credentials.clientId,
        credentials.clientSecret,
      );
      const [sea, yvr] = await Promise.all([
        searchFlights('SEA', selectedAirport.iataCode, date, token),
        searchFlights('YVR', selectedAirport.iataCode, date, token),
      ]);
      onResults(selectedAirport, date, sea, yvr);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Could not fetch flights. Check credentials or try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>✈️ FlightComp</Text>
        <TouchableOpacity onPress={onConfig}>
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.searchScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.searchHeading}>Where to?</Text>
        <Text style={styles.searchSub}>
          Compare flights from Seattle (SEA) and Vancouver (YVR)
        </Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Destination City or Airport</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Tokyo, New York, London…"
            placeholderTextColor="#666"
            value={query}
            onChangeText={handleQueryChange}
          />

          {selectedAirport && (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedText}>
                ✓ {selectedAirport.cityName} ({selectedAirport.iataCode})
              </Text>
            </View>
          )}

          {suggestions.length > 0 && !selectedAirport && (
            <View style={styles.dropdown}>
              {suggestions.map(ap => (
                <TouchableOpacity
                  key={ap.iataCode}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedAirport(ap);
                    setQuery(`${ap.cityName} (${ap.iataCode})`);
                    setSuggestions([]);
                  }}>
                  <Text style={styles.dropdownCode}>{ap.iataCode}</Text>
                  <View style={{flex: 1}}>
                    <Text style={styles.dropdownCity}>{ap.cityName}</Text>
                    <Text style={styles.dropdownName}>{ap.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Departure Date</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            value={date}
            onChangeText={setDate}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSearch}
          disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" style={{marginRight: 10}} />
              <Text style={styles.primaryBtnText}>Searching both cities…</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>🔍 Compare Flights</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultsScreen({
  dest,
  date,
  seaFlights,
  yvrFlights,
  onBack,
}: {
  dest: Airport;
  date: string;
  seaFlights: FlightOffer[];
  yvrFlights: FlightOffer[];
  onBack: () => void;
}) {
  const seaPrice = seaFlights[0]
    ? parseFloat(seaFlights[0].price.total)
    : Infinity;
  const yvrPrice = yvrFlights[0]
    ? parseFloat(yvrFlights[0].price.total)
    : Infinity;
  const diff = Math.abs(seaPrice - yvrPrice);
  const hasComparison =
    seaFlights.length > 0 && yvrFlights.length > 0;

  let bannerText = '';
  let bannerStyle = styles.bannerNeutral;
  if (hasComparison) {
    if (seaPrice < yvrPrice) {
      bannerText = `Seattle saves you $${diff.toFixed(0)}`;
      bannerStyle = styles.bannerSea;
    } else if (yvrPrice < seaPrice) {
      bannerText = `Vancouver saves you $${diff.toFixed(0)}`;
      bannerStyle = styles.bannerYvr;
    } else {
      bannerText = 'Same price from both cities!';
    }
  }

  return (
    <>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Results</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView style={{flex: 1}}>
        <Text style={styles.resultsDestination}>
          Flights to {dest.cityName} ({dest.iataCode})
        </Text>
        <Text style={styles.resultsDate}>{date}</Text>

        {hasComparison && (
          <View style={[styles.banner, bannerStyle]}>
            <Text style={styles.bannerText}>{bannerText}</Text>
          </View>
        )}

        <View style={styles.columnsRow}>
          <OriginColumn
            origin="SEA"
            label="Seattle"
            color="#1e40af"
            flights={seaFlights}
            cheapestOther={yvrPrice}
            dest={dest.iataCode}
            date={date}
          />
          <OriginColumn
            origin="YVR"
            label="Vancouver"
            color="#6d28d9"
            flights={yvrFlights}
            cheapestOther={seaPrice}
            dest={dest.iataCode}
            date={date}
          />
        </View>

        <View style={styles.googleFlightsRow}>
          <Text style={styles.googleFlightsTitle}>Open in Google Flights</Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity
              style={[styles.googleBtn, {backgroundColor: '#1e40af'}]}
              onPress={() =>
                Linking.openURL(
                  buildGoogleFlightsUrl('SEA', dest.iataCode, date),
                )
              }>
              <Text style={styles.googleBtnText}>SEA →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.googleBtn, {backgroundColor: '#6d28d9'}]}
              onPress={() =>
                Linking.openURL(
                  buildGoogleFlightsUrl('YVR', dest.iataCode, date),
                )
              }>
              <Text style={styles.googleBtnText}>YVR →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, {margin: 16}]}
          onPress={onBack}>
          <Text style={styles.primaryBtnText}>New Search</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

interface ResultsState {
  dest: Airport;
  date: string;
  sea: FlightOffer[];
  yvr: FlightOffer[];
}

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('config');
  const [credentials, setCredentials] = useState<Credentials>({
    clientId: '',
    clientSecret: '',
  });
  const [results, setResults] = useState<ResultsState | null>(null);

  const handleCredentialsSave = (c: Credentials) => {
    tokenCache = null; // clear cached token when credentials change
    setCredentials(c);
    setScreen('search');
  };

  const handleResults = (
    dest: Airport,
    date: string,
    sea: FlightOffer[],
    yvr: FlightOffer[],
  ) => {
    setResults({dest, date, sea, yvr});
    setScreen('results');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      {screen === 'config' && (
        <ConfigScreen onSave={handleCredentialsSave} />
      )}
      {screen === 'search' && (
        <SearchScreen
          credentials={credentials}
          onResults={handleResults}
          onConfig={() => setScreen('config')}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          dest={results.dest}
          date={results.date}
          seaFlights={results.sea}
          yvrFlights={results.yvr}
          onBack={() => setScreen('search')}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#0f0f1a'},

  // Config screen
  configScroll: {padding: 24, paddingTop: 48},
  appIcon: {fontSize: 56, textAlign: 'center', marginBottom: 8},
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  link: {color: '#7c83fd', textDecorationLine: 'underline'},

  // Shared card
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardHint: {fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 18},

  // Field
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c83fd',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0d0d1f',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },

  // Buttons
  primaryBtn: {
    backgroundColor: '#7c83fd',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryBtnDisabled: {opacity: 0.55},
  primaryBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  loadingRow: {flexDirection: 'row', alignItems: 'center'},

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
  },
  topBarTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
  settingsBtn: {fontSize: 22},
  backBtn: {fontSize: 15, color: '#7c83fd', fontWeight: '600'},

  // Search screen
  searchScroll: {padding: 16, paddingTop: 24},
  searchHeading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  searchSub: {fontSize: 14, color: '#777', marginBottom: 24, lineHeight: 20},

  // Dropdown
  dropdown: {
    backgroundColor: '#0d0d1f',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#2a2a40',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    gap: 12,
  },
  dropdownCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c83fd',
    width: 44,
  },
  dropdownCity: {fontSize: 14, fontWeight: '600', color: '#fff'},
  dropdownName: {fontSize: 12, color: '#666', marginTop: 2},
  selectedBox: {
    backgroundColor: '#0d3326',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  selectedText: {color: '#4ade80', fontWeight: '600', fontSize: 14},

  // Results screen
  resultsDestination: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  resultsDate: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  bannerNeutral: {backgroundColor: '#2a2a40'},
  bannerSea: {backgroundColor: '#1e3a8a'},
  bannerYvr: {backgroundColor: '#5b21b6'},
  bannerText: {color: '#fff', fontSize: 15, fontWeight: '700'},

  // Columns
  columnsRow: {flexDirection: 'row', paddingHorizontal: 8, gap: 8},
  col: {flex: 1},
  originHeader: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  winnerCrown: {fontSize: 16, marginBottom: 2},
  originCode: {fontSize: 24, fontWeight: '800', color: '#fff'},
  originLabel: {fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2},

  // Flight card
  flightCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  flightCardHighlight: {borderColor: '#4ade80', borderWidth: 2},
  bestBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 1,
    marginBottom: 4,
  },
  flightPrice: {fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4},
  flightCurrency: {fontSize: 12, fontWeight: '400', color: '#888'},
  flightTimes: {fontSize: 12, color: '#ccc', marginBottom: 3},
  flightMeta: {fontSize: 11, color: '#777', marginBottom: 2},
  flightCarrier: {fontSize: 11, color: '#7c83fd', marginTop: 2},

  // No results
  noResultsBox: {padding: 16, alignItems: 'center'},
  noResultsText: {color: '#666', fontSize: 13, marginBottom: 8},
  googleLink: {color: '#7c83fd', fontSize: 12, textDecorationLine: 'underline'},

  // Google Flights links
  googleFlightsRow: {
    margin: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  googleFlightsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  googleBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
});
