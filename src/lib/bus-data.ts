export type Bus = {
  id: string;
  operator: string;
  type: "AC Sleeper" | "Non-AC Sleeper" | "AC Seater" | "Non-AC Seater" | "Luxury Coach";
  busNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  from: string;
  to: string;
  fare: number;
  rating: number;
  seatsLeft: number;
  totalSeats: number;
  amenities: string[];
  boardingPoints: string[];
  droppingPoints: string[];
};

export const CITIES = [
  "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Delhi", "Chennai",
  "Ahmedabad", "Jaipur", "Goa", "Kolkata", "Indore", "Surat",
];

export const BUSES: Bus[] = [
  {
    id: "bus-1", operator: "VRL Travels", type: "AC Sleeper", busNumber: "KA-01-3456",
    departure: "21:30", arrival: "06:45", duration: "9h 15m",
    from: "Bengaluru", to: "Mumbai", fare: 1499, rating: 4.5,
    seatsLeft: 14, totalSeats: 36,
    amenities: ["WiFi", "Charging Point", "Water Bottle", "Blanket"],
    boardingPoints: ["Majestic 21:30", "Yeshwanthpur 22:00", "Hebbal 22:30"],
    droppingPoints: ["Dadar 06:00", "Borivali 06:45"],
  },
  {
    id: "bus-2", operator: "SRS Travels", type: "AC Seater", busNumber: "TN-09-7821",
    departure: "22:15", arrival: "08:00", duration: "9h 45m",
    from: "Bengaluru", to: "Mumbai", fare: 999, rating: 4.2,
    seatsLeft: 22, totalSeats: 40,
    amenities: ["WiFi", "Charging Point", "Water Bottle"],
    boardingPoints: ["Madiwala 22:15", "Majestic 22:45"],
    droppingPoints: ["Vashi 07:30", "Dadar 08:00"],
  },
  {
    id: "bus-3", operator: "Orange Tours", type: "Luxury Coach", busNumber: "MH-12-9988",
    departure: "19:00", arrival: "04:30", duration: "9h 30m",
    from: "Bengaluru", to: "Mumbai", fare: 1899, rating: 4.7,
    seatsLeft: 6, totalSeats: 30,
    amenities: ["WiFi", "Charging Point", "Snacks", "Blanket", "Entertainment"],
    boardingPoints: ["Marathahalli 19:00", "Majestic 19:45"],
    droppingPoints: ["Pune 02:30", "Dadar 04:30"],
  },
  {
    id: "bus-4", operator: "RedBus Express", type: "Non-AC Sleeper", busNumber: "AP-05-2244",
    departure: "23:00", arrival: "09:30", duration: "10h 30m",
    from: "Bengaluru", to: "Mumbai", fare: 749, rating: 3.9,
    seatsLeft: 18, totalSeats: 36,
    amenities: ["Charging Point", "Water Bottle"],
    boardingPoints: ["Electronic City 23:00"],
    droppingPoints: ["Dadar 09:30"],
  },
  {
    id: "bus-5", operator: "Neeta Tours", type: "AC Sleeper", busNumber: "MH-04-7711",
    departure: "20:45", arrival: "07:15", duration: "10h 30m",
    from: "Bengaluru", to: "Mumbai", fare: 1599, rating: 4.4,
    seatsLeft: 9, totalSeats: 36,
    amenities: ["WiFi", "Charging Point", "Blanket", "Water Bottle"],
    boardingPoints: ["Majestic 20:45", "Yeshwanthpur 21:15"],
    droppingPoints: ["Borivali 07:15"],
  },
];

export function getBus(id: string) {
  return BUSES.find((b) => b.id === id);
}

export type SeatStatus = "available" | "booked" | "selected" | "female";

// Returns a deterministic seat map: 2-1 sleeper style (lower & upper decks)
export function buildSeatMap(bus: Bus): { id: string; row: number; col: number; deck: "lower" | "upper"; status: SeatStatus }[] {
  const seats: { id: string; row: number; col: number; deck: "lower" | "upper"; status: SeatStatus }[] = [];
  const perDeck = bus.totalSeats / 2;
  const rows = Math.ceil(perDeck / 3);
  const bookedHash = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  (["lower", "upper"] as const).forEach((deck) => {
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= 3; c++) {
        const id = `${deck === "lower" ? "L" : "U"}${r}${c === 3 ? "S" : c}`;
        const h = (bookedHash(id + bus.id)) % 7;
        const status: SeatStatus = h === 0 ? "booked" : h === 1 ? "female" : "available";
        seats.push({ id, row: r, col: c, deck, status });
      }
    }
  });
  return seats;
}
