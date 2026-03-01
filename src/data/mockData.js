/**
 * Mock data for EMS frontend - aligns with schema (users, events, clubs, registrations, announcements).
 * Replace with API calls when backend is ready.
 */

export const MOCK_USER = {
  id: "user-1",
  name: "Alex Rivera",
  email: "alex.rivera@mitsgwl.ac.in",
  student_id: "20240912",
  role: "student",
  department: "CS Major, 2025",
  avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAILL-bv1b71qv4xbT7t7jcfKpZID3JgjfST7J2rOM2H1PAUVMHkdB78n5-_X7mOX0O4DFW8ImfjBk5_9xFxvCl5PSx6a2xHVuyqAKYD9OWPovYoWZDOr8xu8_Myxb8s5S5xTHFXY_qHAfdnAOQyl1AS_NEkiUTdhDigmUif1Ir8hpZ5X51E8n4HsQNIUZYc45Q87CpXmnfPy4rBgW-2PW3b92lCqVl9MslkKP6UD6M7jpB9pusZtGbrL5_IXIzZMu4LIK96ZA--AFI",
};

export const MOCK_CLUBS = [
  { id: "club-1", name: "Computer Science Society", description: "Tech and coding club" },
  { id: "club-2", name: "Cultural Council", description: "Cultural events" },
  { id: "club-3", name: "Robotics Club", description: "Robotics and automation" },
];

/** Club directory (rich) for Club Directory / Club Profile pages */
export const CLUB_DIRECTORY_MOCK = [
  { id: "club-1", slug: "code-chef-mits", name: "Code Chef MITS", category: "Technical", description: "The official competitive programming and algorithm community for tech enthusiasts.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2vR2jmdaj5q_nrw2xvyuT35lipURJwyCfmvAnA0eUcnSF9dib1M_j2xWoR1qR19ptWFz3A4OKe2bCsF1WgvmyNcQadrIOCZmMjP3MgwLd4GJx2QHQfm5e0wgcsO1Myunek-r-Q9_L3QVdTrj3snFCHOqW9I73A7kfwRq6xXSF0_oYIH7tRfkGcZmlMz7q4fX3LOSOQH4dPTPsFQMYY8N1-rQ4IWiNeodSwDD3ZMhZbn1MBYstJ3WaHDccZamB5eTJXnu-bugU7IIS", activeEvents: 3, verified: true },
  { id: "club-2", slug: "aero-club", name: "Aero Club", category: "Technical", description: "Designing and manufacturing autonomous aerial vehicles and drones.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtfad3_tNFzcJvEz7Nuk-iU3uiuQoJPlI_AvcIxziyiZIcIguv3gK97Bk6c3obm4-c82D037q1hrGRfEieiAQ4cOZf4ANkY3NpXnrr_p2JL8iGHa8LgmKCdw2IhXGlM_XpM6xoLhjnVhXub18jHAX15nbbjpfbf4L-EE7mxYPq05CgbWoU26dNT7OcC1rS0WBkJpj7j4chM8B5XWKI-7sl02EUPOAAc0QsZagH7M1ZBAjFOjawOnxmWIURi7EuvtjEx7MCs6CtQ35U", activeEvents: 1, verified: true },
  { id: "club-3", slug: "dance-society", name: "Dance Society", category: "Cultural", description: "The hub for choreography, expression, and competitive dance performances.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4y6v-Rq5z7je61erM2f70oAXb3voRvCr72uQxEpEQhaqozuWVBF8YM5WPQw1QJhI75yW2sx79lmKG-_Nu5nEMq1wzDqA19snZDx87rQ0gmv0JXSxYCfdb7GBZK9X7BUPvfJP-DgX7Jm8xTOGeWc_8k0DCHWh496TI4ZXqh9KciKmYfeLK_4nzA82404FLSJ2Gx6PaShJmPNKvuGPL99cPrNmqbEwQIGEa3BMeE_l6FhXlmLZbBx4byeC0SHc-hFWUO8JFhmhvcraj", activeEvents: 5, verified: true },
  { id: "club-4", slug: "nss-mits", name: "NSS MITS", category: "Social", description: "National Service Scheme dedicated to community development and social welfare.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuOw9Ow_etZj-A3vLxWWtegAyKBWKCkLa_73ZYQ6uC8Q0mxz1LyrTN7OA2Jhbf9POwNHvRPPlqh5tvDjNkQG-6ns6KUoEt7ziYSPB0rMR2dLxnsYhNfNzd7D-LOZAn55DWu6XwizqFKRRIHyhfiXaqc-TwdkQsNw8dzSHEPrbghWo0_kBX8MZwuCIMl1Xsh7XxuP9We0NM5xDnTgl4ShF0PlcsAQp3UCBQYS5Bzbde9QGYsx-DjEwLSqd8PxRrwCe6RLMAYGVnyrtl", activeEvents: 2, verified: true },
  { id: "club-5", slug: "editorial-board", name: "Editorial Board", category: "Literary", description: "The voice of the college. Managing the official newsletter and publications.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbvwGbiBNawcRdMBTPHHsrzBkri1tRQC7ocaihJu95-MH2R6GH5pB-6MywLSNiz41k-hnRzyINQLmoKv9Xf5V3cb2wIytdm14_RMXxkddhtz9froesnH7NtaHDdZL0BURH9JQF3VnOi74tTZxcjK9XbfyDU2oZK7LLSZpUcWPa2MiTnaG8YBn5v35crQWzH6UyqjaGmzCnALrYWpnjN73NkUnke4TV7XpKhefqquGddhZEJpaGfcJ2Hn2lTQXNZHoNVSalWLKWd-k2", activeEvents: 0, verified: true },
  { id: "club-6", slug: "ieee-branch", name: "IEEE Branch", category: "Technical", description: "World's largest technical professional organization for tech advancement.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBh2kFALmUi6jZ6fxBWVEJohW0oCdtSU7fbZeSqbzFANq96wsH4_NRMDYZMqKUgQD9jSE8S2K5YkN9anhcAdc1MZsa5rimf84tHc1MXRFim4vVPZHfm8pT7mfAzRP3pSBQmNjVo_ATopYO1FQ5KCdcbnjCqhFev3NRTuHKIhUv0wK_hGygKzIfL7HSFNO58I87dkt4OCVE-Mmm6qkcn_g8QNJspCAVsrL7QMnITRA_OBI2JduA-kdTnMFDnvpZXlu_QbVnPuhfIjcLO", activeEvents: 4, verified: true },
  { id: "club-7", slug: "sports-committee", name: "Sports Committee", category: "Sports", description: "Coordinating all intramural and varsity sports competitions at MITS.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMJCjxwy7Csu7OBAJsc2YnhFnTOox56diJp4_HymcnXUQcx64OdVRRv0xR3hmbmf6UUjtS6THolapXrLUl5HdieCEkSTJrfZAwpZTMgz5pp5vnG0cl5GVuVtBm9SsQZFr5cEALIsnM0QNt_1t9GObxUBTdB2voTaQDxPEi_ICcnAmLXMmZmGXPofZGE2NUn402Fjqd5cjFfx8f36ktw-2qCn1bdrufh8DBcPGdBSINbt4bJ6oIn-XzjMIRLhViR1zdDwJcAT8x2xun", activeEvents: 2, verified: true },
  { id: "club-8", slug: "entrepreneurship-cell", name: "Entrepreneurship Cell", category: "Research", description: "Fostering innovation and building the startup ecosystem within the campus.", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl02ytR4EFWP7b7C1hAaUCHI59x3syzN0Hs6eZBrxmaoe4p8svZXHlVXK1PWuJhdo6sN0W0rNCJWs4nrJwlKRuw7mSLMNE8L0kjWpdxmXliHgz78FufCFH4H_gyauO6uFltfcRhZzPptDbg_0aHIxof3Gs0ABp7e0g0xpc8jtv6M5UULJQgLVvU9A4Rkg3GKfL0DCh2T9_A_EjZ_xvuLwirojT-Jf5LN4mc3TY65CWgEiPiykQJYRBAIMtCwH6zurVxDQfz0PmjsJk", activeEvents: 1, verified: true },
];

export const MOCK_EVENTS = [
  {
    id: "evt-1",
    slug: "national-tech-symposium-2024",
    title: "National Tech Symposium 2024",
    description: "The National Tech Symposium 2024 is the largest gathering of student innovators, developers, and tech enthusiasts. Theme: Future Forge — sustainable AI and collaborative engineering. Workshops, hackathons, keynote speeches.",
    club_id: "club-1",
    club_name: "Computer Science Society",
    event_date: "2024-10-24",
    start_time: "09:00",
    end_time: "18:00",
    location: "Main Tech Auditorium",
    total_seats: 100,
    available_seats: 75,
    registration_deadline: "2024-10-20",
    status: "upcoming",
    visibility: "internal",
    organizer_name: "Alex Chen",
    organizer_email: "alex.chen@mitsgwl.ac.in",
    rules: "1. Valid college ID required. 2. Laptop recommended for workshops. 3. No late entry after 10 AM.",
    agenda: [
      { time: "09:00 AM", label: "Opening Ceremony & Keynote" },
      { time: "11:00 AM", label: "Hackathon Kick-off" },
      { time: "02:00 PM", label: "Expert Panel: Ethical AI" },
    ],
  },
  {
    id: "evt-2",
    slug: "winter-music-fest",
    title: "Winter Music Fest",
    description: "Annual music and performance festival.",
    club_id: "club-2",
    club_name: "Cultural Council",
    event_date: "2024-11-02",
    start_time: "14:00",
    end_time: "22:00",
    location: "Open Amphitheatre",
    total_seats: 200,
    available_seats: 200,
    registration_deadline: "2024-10-28",
    status: "upcoming",
    visibility: "internal",
    organizer_name: "Priya Sharma",
    organizer_email: "priya@mitsgwl.ac.in",
    rules: "No external recording without permission.",
    agenda: [],
  },
  {
    id: "evt-3",
    slug: "career-fair-2024",
    title: "Career Fair 2024",
    description: "Meet recruiters from top companies. Bring your resume.",
    club_id: "club-1",
    club_name: "Computer Science Society",
    event_date: "2024-11-15",
    start_time: "10:00",
    end_time: "17:00",
    location: "Convocation Hall",
    total_seats: 150,
    available_seats: 0,
    registration_deadline: "2024-11-10",
    status: "closed",
    visibility: "internal",
    organizer_name: "Career Cell",
    organizer_email: "career@mitsgwl.ac.in",
    rules: "Formal dress code.",
    agenda: [],
  },
  {
    id: "evt-4",
    slug: "photography-workshop",
    title: "Photography Workshop",
    description: "Hands-on photography and editing workshop.",
    club_id: "club-3",
    club_name: "Robotics Club",
    event_date: "2024-11-18",
    start_time: "09:00",
    end_time: "13:00",
    location: "Media Lab, Block B",
    total_seats: 30,
    available_seats: 12,
    registration_deadline: "2024-11-15",
    status: "upcoming",
    visibility: "internal",
    organizer_name: "Rahul Verma",
    organizer_email: "rahul@mitsgwl.ac.in",
    rules: "Bring your own camera if possible.",
    agenda: [],
  },
];

export const MOCK_ANNOUNCEMENTS = [
  { id: "ann-1", event_id: "evt-1", title: "Venue Change: Room 302", message: "Neural Networks workshop moved to Main Hall (302).", created_at: "2024-10-22T10:30:00" },
  { id: "ann-2", event_id: "evt-1", title: "New Speaker Confirmed", message: "Dr. Jane Smith from MIT will be our guest for the closing ceremony.", created_at: "2024-10-21T16:15:00" },
];

// Campus notifications (audience: all | students | faculty | club_leaders)
export const MOCK_NOTIFICATIONS = [
  { id: "notif-1", title: "Spring Gala Tickets Live", message: "Register for Spring Gala. Limited seats.", audience: "all", createdBy: "admin", createdAt: new Date().toISOString(), pinned: true },
  { id: "notif-2", title: "Library 24/7 During Finals", message: "Main library open 24/7 from Mar 18–25.", audience: "students", createdBy: "admin", createdAt: new Date(Date.now() - 86400000).toISOString(), pinned: false },
  { id: "notif-3", title: "Venue Change: Room 302", message: "Neural Networks workshop moved to Main Hall (302).", audience: "students", createdBy: "admin", createdAt: "2024-10-22T10:30:00", pinned: false },
];

// Initial registrations for current user (mock)
export const MOCK_REGISTRATIONS = [
  { id: "reg-1", user_id: "user-1", event_id: "evt-1", status: "confirmed", registered_at: "2024-10-18T12:00:00", qr_code: "EMS-EVT1-USER1-20240912" },
];
