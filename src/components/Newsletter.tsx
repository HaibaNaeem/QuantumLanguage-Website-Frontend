import React from 'react';
import { motion } from 'motion/react';

export const Newsletter = () => {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
const [message, setMessage] = React.useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage('');

  console.log("Submit clicked! Attempting to send email:", email); // ADD THIS LINE

  try {
    const response = await fetch('http://localhost:5000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log("Server response:", data); // ADD THIS LINE
    
    if (response.ok) {
        setSubscribed(true); //  button set to subscribed state
        setEmail(''); // This clears the input box immediately
        setMessage("Thanks for subscribing!");
      // Wait 3 seconds, then reset the button back to 'SUBSCRIBE'
      setTimeout(() => {
        setSubscribed(false);
        setMessage('');
      }, 3000);
    }else {
      // This runs if the status is 400 (Already subscribed)
     setMessage(data.message);
     setEmail('');
     setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  } catch (error) {
    console.error("Critical error:", error); // ADD THIS LINE
    setMessage("Connection error. Please try again.");
    setEmail('');
    setTimeout(() => {
        setMessage('');
      }, 3000);
  }
};

  return (
    <section className="py-24 bg-cyan-500 text-black overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border-4 border-black rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border-4 border-black rounded-full animate-pulse delay-700" />
      </div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tighter">Join the Quantum Revolution</h2>
        <p className="text-black/70 mb-10 max-w-xl mx-auto font-medium">
          Get the latest updates, security advisories, and early access to new features delivered straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="your@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-6 py-4 rounded-full bg-black/10 border border-black/20 placeholder:text-black/40 outline-none focus:bg-black/20 transition-all font-bold"
          />
          <button 
            type="submit"
            className="px-8 py-4 rounded-full bg-black text-white font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
            disabled={subscribed}
          >
            {subscribed ? 'SUBSCRIBED!' : 'SUBSCRIBE'}
          </button>
        </form>
        {message && (
  <p className={`mt-4 text-lg text-center font-semibold ${subscribed ? 'text-green-600' : 'text-red-600'}`}>
    {message}
  </p>
)}
        {subscribed && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 font-bold text-sm uppercase tracking-widest"
          >
            Welcome to the future of systems programming.
          </motion.p>
        )}
      </div>
    </section>
  );
};
