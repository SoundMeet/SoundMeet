import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  FaMapMarkerAlt,
  FaGuitar,
  FaBullhorn,
  FaUsers,
  FaComments,
  FaHandshake,
  FaSearch,
  FaCalendarPlus,
  FaChevronDown,
} from 'react-icons/fa'
import { useState } from 'react'
import LogoWithText from '../assets/LogowText.svg'

// ─── FAQ Accordion ───────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How do I find musicians near me?',
    a: 'Open SoundMeet and the map on the home page shows jam sessions and live shows happening near your location. You can filter by genre, instrument, and distance to find exactly the kind of musicians you want to play with.',
  },
  {
    q: 'Is SoundMeet free to use?',
    a: 'Yes — SoundMeet is completely free. Create a profile, discover jams, host your own sessions, and connect with other musicians at no cost.',
  },
  {
    q: 'How do I create a jam session?',
    a: 'Tap the "+" button on the home screen, choose "Jam Session," fill in the details — genre, instruments needed, location, date, and description — and publish. Musicians nearby will see it on the map and can request to join.',
  },
  {
    q: 'How do I promote a live show?',
    a: 'Create a "Show" event instead of a jam session. Add your venue, lineup, date, time, and a description. Shows appear on the SoundMeet map for local musicians and music fans to discover.',
  },
  {
    q: 'What is the Meet feature?',
    a: 'Meet is a swipe-based matchmaking system for musicians. See profiles of nearby musicians and swipe right if you want to connect. If you both swipe right, you match and can start chatting — perfect for finding bandmates or jam partners.',
  },
  {
    q: 'Can I use SoundMeet to find a bandmate?',
    a: 'Absolutely. Use the "Find a Bandmate" opportunity listing if your band is looking for a new member, or browse "Join a Band" listings if you\'re a musician looking to join one. You can also use the Meet feature to match with compatible musicians.',
  },
  {
    q: 'How does the group chat work?',
    a: 'Every jam session has a built-in group chat. Once you join a jam, you can message all the other members to coordinate details like what songs to play, what gear to bring, and logistics.',
  },
  {
    q: 'Do I need to be an experienced musician?',
    a: 'Not at all. SoundMeet is for musicians of every skill level — from total beginners looking for their first jam to seasoned pros seeking new collaborators. Many jam hosts specify the vibe and skill level in their descriptions, so you can find sessions that match your comfort zone.',
  },
  {
    q: 'What cities is SoundMeet available in?',
    a: 'SoundMeet works everywhere. It\'s location-based, so wherever you are, you\'ll see jams and musicians near you. The more musicians in your area who join, the more vibrant your local scene becomes.',
  },
  {
    q: 'How is SoundMeet different from other music apps?',
    a: 'Most music apps focus on streaming or learning. SoundMeet is built specifically for connecting musicians in person — to jam, perform, and form bands together. It\'s the social network for making music, not just listening to it.',
  },
]

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div
      className="border-b"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left"
      >
        <span
          className="text-[15px] font-medium text-white"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {item.q}
        </span>
        <FaChevronDown
          className="text-xs flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'rgba(255,255,255,0.3)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <p
          className="px-1 pb-4 text-sm leading-relaxed"
          style={{ color: 'rgba(229,226,225,0.6)', fontFamily: 'Sora, sans-serif' }}
        >
          {item.a}
        </p>
      </motion.div>
    </div>
  )
}

// ─── Feature card ────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: 'rgba(220,46,115,0.10)',
          border: '1px solid rgba(220,46,115,0.18)',
        }}
      >
        <Icon className="text-base" style={{ color: '#DC2E73' }} />
      </div>
      <h3
        className="text-[15px] font-semibold text-white mb-1.5"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'rgba(229,226,225,0.55)', fontFamily: 'Sora, sans-serif' }}
      >
        {description}
      </p>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FaMapMarkerAlt,
    title: 'Discover Jams & Shows Nearby',
    description:
      'Browse a live map of jam sessions and live shows happening around you. Filter by genre, instrument, and distance to find your next session.',
  },
  {
    icon: FaCalendarPlus,
    title: 'Create Jam Sessions',
    description:
      'Host your own jam — set the genre, instruments needed, location, and date. Musicians nearby see it on the map and can request to join.',
  },
  {
    icon: FaBullhorn,
    title: 'Promote Live Shows',
    description:
      'Playing a gig? Create a show listing with your venue, lineup, and details. Get discovered by local musicians and music fans on the SoundMeet map.',
  },
  {
    icon: FaSearch,
    title: 'Meet Musicians',
    description:
      'Swipe through profiles of nearby musicians. Match with players who share your genres and vibe — like finding a bandmate, powered by matchmaking.',
  },
  {
    icon: FaHandshake,
    title: 'Find a Bandmate or Join a Band',
    description:
      'Post or browse opportunity listings. Looking for a drummer? Need a band to join? SoundMeet connects musicians seeking each other for longer-term collaborations.',
  },
  {
    icon: FaComments,
    title: 'Group Chat for Every Jam',
    description:
      'Each jam session has a built-in group chat. Coordinate setlists, gear, and logistics with everyone who joined — all in one place.',
  },
  {
    icon: FaGuitar,
    title: 'Musician Profiles',
    description:
      'Showcase your instruments, genres, experience level, and music links. Let other musicians know what you bring to the table.',
  },
  {
    icon: FaUsers,
    title: 'Activity Feed',
    description:
      'Stay in the loop with what your friends and local musicians are up to — new jams, upcoming shows, and posts from the community.',
  },
]

export default function About() {
  const [openFAQ, setOpenFAQ] = useState(null)

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>About SoundMeet — Find Musicians, Join Jams, Make Music</title>
        <meta name="description" content="Learn what SoundMeet offers — discover jams, promote shows, meet musicians, find bandmates, and more. Everything you need to make music together." />
        <link rel="canonical" href="https://www.soundmeet.app/about" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h1 className="flex items-baseline gap-3 flex-wrap mb-4">
            <span
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              About
            </span>
            <img
              src={LogoWithText}
              alt="SoundMeet"
              className="h-7 sm:h-9 relative top-[1px]"
            />
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl"
            style={{ color: 'rgba(229,226,225,0.6)', fontFamily: 'Sora, sans-serif' }}
          >
            SoundMeet is the platform for musicians who want to play together in
            person. Discover jam sessions and live shows near you, connect with
            local musicians, find bandmates, and build your music community —
            all from one app.
          </p>
        </motion.div>

        {/* Features grid */}
        <section className="mb-16">
          <h2
            className="text-xl font-bold text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            What You Can Do on SoundMeet
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.05} />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2
            className="text-xl font-bold text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Frequently Asked Questions
          </h2>
          <div
            className="rounded-2xl px-4 sm:px-5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </section>

        {/* JSON-LD: FAQPage schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ_ITEMS.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.a,
                },
              })),
            }),
          }}
        />
      </div>
    </div>
  )
}
