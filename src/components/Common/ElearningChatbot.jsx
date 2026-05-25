import React, { useEffect, useRef, useState } from "react";
import { apiConnector } from "../../services/apiConnector";
import { categories, courseEndpoints } from "../../services/apis";

/**
 * E-Learning Platform Chatbot with course information.
 * - Frontend-only prototype. For production, use a backend proxy to hide the API key.
 * - Customizable course data in the `COURSE_DATA` constant below.
 */

// ===== CUSTOMIZABLE COURSE DATA =====
// Modify this data to match your e-learning platform's courses
const COURSE_DATA = {
  categories: [
    {
      id: "computer-science",
      name: "Computer Science",
      description: "Learn programming, web development, and computer science fundamentals",
      link: "http://localhost:3000/catalog/computer-science",
      courses: [
        {
          id: "69bfda46e4d9530c32ce864c",
          title: "Web Development",
          description: "Complete web development from basics to advanced",
          level: "Beginner to Advanced",
          duration: "12 weeks",
          price: 49.99,
          instructor: "John Smith",
          rating: 4.7,
          enrolled: 12500,
          link: "http://localhost:3000/courses/69bfda46e4d9530c32ce864c",
          topics: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"]
        }
      ]
    },
    {
      id: "mechanical",
      name: "Mechanical Engineering",
      description: "Learn mechanical engineering principles and applications",
      link: "http://localhost:3000/catalog/mechanical",
      courses: [
        {
          id: "69c9570dcea69ff8007f91c5",
          title: "Mechanical Engineering Fundamentals",
          description: "Core concepts of mechanical engineering",
          level: "Intermediate",
          duration: "10 weeks",
          price: 59.99,
          instructor: "Sarah Johnson",
          rating: 4.8,
          enrolled: 8300,
          link: "http://localhost:3000/courses/69c9570dcea69ff8007f91c5",
          topics: ["Thermodynamics", "Fluid Mechanics", "Materials Science", "CAD"]
        }
      ]
    }
  ],
  platform: {
    name: "LearnHub",
    aboutLink: "http://localhost:3000/about",
    contactLink: "http://localhost:3000/contact",
    loginLink: "http://localhost:3000/login",
    signupLink: "http://localhost:3000/signup",
    features: [
      "Self-paced learning",
      "Certificate of completion",
      "Mobile app access",
      "Instructor support",
      "Community forums",
      "Lifetime access to purchased courses"
    ],
    paymentMethods: ["Credit Card", "PayPal", "Bank Transfer"],
    support: "24/7 customer support via chat and email"
  }
};

const ElearningChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [liveCourseData, setLiveCourseData] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- fetch live courses & categories from backend ---
  useEffect(() => {
    const fetchLiveDetails = async () => {
      try {
        const catRes = await apiConnector("GET", categories.CATEGORIES_API);
        const categoriesList = catRes?.data?.data || [];

        const courseRes = await apiConnector("GET", courseEndpoints.GET_ALL_COURSE_API);
        const coursesList = courseRes?.data?.data || [];

        const formattedCategories = categoriesList.map(cat => {
          const catCourses = coursesList.filter(course => {
            if (Array.isArray(cat.courses)) {
              return cat.courses.some(c => String(c._id || c) === String(course._id));
            }
            return false;
          }).map(course => {
            const instructorName = course.instructor 
              ? `${course.instructor.firstName} ${course.instructor.lastName}` 
              : "Unknown Instructor";

            return {
              id: course._id,
              title: course.courseName,
              description: course.courseDescription || "Explore this course on our platform.",
              price: course.price === 0 ? "FREE" : `$${course.price}`,
              instructor: instructorName,
              rating: course.ratingAndReviews?.length 
                ? (course.ratingAndReviews.reduce((acc, curr) => acc + curr.rating, 0) / course.ratingAndReviews.length).toFixed(1) 
                : "Not rated yet",
              link: `http://localhost:3000/courses/${course._id}`,
            };
          });

          return {
            id: cat._id,
            name: cat.name,
            description: cat.description,
            link: `http://localhost:3000/catalog/${cat.name.split(" ").join("-").toLowerCase()}`,
            courses: catCourses
          };
        });

        const platformData = {
          categories: formattedCategories,
          platform: {
            name: "StudyNotion",
            aboutLink: "http://localhost:3000/about",
            contactLink: "http://localhost:3000/contact",
            loginLink: "http://localhost:3000/login",
            signupLink: "http://localhost:3000/signup",
            features: [
              "Self-paced learning",
              "Certificate of completion",
              "Mobile app access",
              "Instructor support",
              "Community forums",
              "Lifetime access to purchased courses"
            ],
            paymentMethods: ["Credit Card", "PayPal", "Bank Transfer", "Razorpay"],
            support: "24/7 customer support via chat and email"
          }
        };

        setLiveCourseData(platformData);
      } catch (err) {
        console.error("Failed to fetch live course details for chatbot:", err);
      }
    };

    fetchLiveDetails();
  }, []);

  // --- auto scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Web Speech API init ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (evt) => {
      const transcript = evt.results?.[0]?.[0]?.transcript;
      if (transcript) setInputText((t) => (t ? t + " " + transcript : transcript));
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;

    return () => {
      try { recognitionRef.current?.stop(); } catch (e) {}
      recognitionRef.current = null;
    };
  }, []);

  // --- welcome message ---
  useEffect(() => {
    const t = setTimeout(() => {
      if (!welcomeShown && messages.length === 0 && !notificationDismissed) {
        setMessages([
          {
            text: "Welcome to StudyNotion! I'm your learning assistant. I can help you find courses, explain pricing, and guide you through our platform. What would you like to learn today?",
            sender: "bot",
            timestamp: new Date(),
            isWelcome: true,
          },
        ]);
        setWelcomeShown(true);
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [welcomeShown, messages.length, notificationDismissed]);

  // --- small notification if closed ---
  useEffect(() => {
    if (isOpen || notificationDismissed) return;
    const show = setTimeout(() => setShowNotification(true), 16000);
    const hide = setTimeout(() => setShowNotification(false), 21000);
    const interval = setInterval(() => {
      if (!isOpen && !notificationDismissed) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    }, 30000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearInterval(interval);
    };
  }, [isOpen, notificationDismissed]);

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const toggleChat = () => {
    setIsOpen((s) => !s);
    if (!isOpen) setShowNotification(false);
  };

  const handleNotificationClick = () => {
    setIsOpen(true);
    setShowNotification(false);
    setNotificationDismissed(true);
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      try { recognitionRef.current.start(); setIsListening(true); } catch (e) { console.error(e); setIsListening(false); }
    }
  };

  // --- fetch with retry for transient statuses ---
  const fetchWithRetry = async (url, options = {}, retries = 3, initialDelay = 800) => {
    let attempt = 0;
    while (attempt <= retries) {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || res.status === 503) {
        if (attempt === retries) return res;
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        attempt += 1;
        continue;
      }
      return res;
    }
    throw new Error("Network error (retry attempts exhausted).");
  };

  // --- language detection using Groq ---
  const detectLanguage = async (text) => {
    if (!text) return "English";

    try {
      const res = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Using a smaller, faster model for language detection
          messages: [
            {
              role: "system",
              content: "You are a language detection assistant. Respond with only the name of the language (e.g., English, Spanish, French, etc.)."
            },
            {
              role: "user",
              content: `Detect the language of this text and respond with just the language name: "${text}"`
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        }),
      });

      if (!res.ok) {
        try { const txt = await res.text(); console.error('Language detect error', res.status, txt); } catch(e){}
        return "English";
      }

      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      }
      return "English";
    } catch (e) {
      console.error("detectLanguage error", e);
      return "English";
    }
  };

  // ===== CUSTOMIZABLE SYSTEM PROMPT =====
  // Modify this prompt to change how the chatbot behaves
  const buildSystemPrompt = (language) => {
    const dataToUse = liveCourseData || COURSE_DATA;
    return `You are "StudyNotion Assistant", a highly intelligent, warm, and professional AI learning consultant for the ed-tech platform StudyNotion.
Your goal is to guide students, recommend relevant courses, answer queries about pricing and platform features, and keep the user motivated.

PLATFORM INFORMATION (LIVE DB CONTEXT):
${JSON.stringify(dataToUse, null, 2)}

TONE & PERSONALITY:
- Warm, encouraging, professional, and natural.
- Sound like a real helpful human learning advisor, not a rigid script or a strict search bar.
- Do NOT repeat the exact same sentence structure or signature line at the end of every message. Keep it diverse and fluid!

INSTRUCTIONS:
1. GREETINGS & WHO ARE YOU: Respond naturally and warmly. Introduce yourself beautifully (e.g. "Hello! I'm your StudyNotion learning advisor. How can I help you excel today?").
2. CONVERSATIONAL HELP: If the user asks a general question about learning, career paths, programming, or engineering (e.g. "how do I start learning code?" or "what is mechanical engineering?"), give them friendly, helpful advice and THEN connect it to a relevant course from our PLATFORM DATA. For example: "That's a great path! To get started, I highly recommend our Web Development course which covers HTML, CSS, and JS..."
3. STRICT FACTUALITY ON SPECIFICS: For exact details about StudyNotion (like prices, instructors, links), use ONLY the facts listed in the PLATFORM DATA CONTEXT. Do not make up non-existent courses or links.
4. OUT-OF-SCOPE ENQUIRIES: If the user asks completely irrelevant questions (like "what is the recipe for cake?" or "who won the soccer match?"), reply politely and shift the focus back: "I'd love to help you with that, but I'm here to assist you on your learning journey with StudyNotion. What skills are you looking to build today?"
5. FORMATTING: Use clean, human-readable markdown. Keep paragraphs short and bullet points easy to read.
6. COMPLIANCE: Respond strictly in the user's detected language: ${language}.`;
  };

  // --- format bot message HTML ---
  const formatBotMessage = (text) => {
    // Simple markdown-like parser for course information
    const lines = text.split('\n').filter((l) => l.trim() !== "");
    
    // Check for URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          
          // Headers
          if (trimmed.startsWith('###')) {
            return <h3 key={i} className="font-bold text-white mt-3">{trimmed.replace('###', '').trim()}</h3>;
          }
          if (trimmed.startsWith('##')) {
            return <h2 key={i} className="font-bold text-white text-lg mt-4">{trimmed.replace('##', '').trim()}</h2>;
          }
          
          // Bullet points
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const content = trimmed.substring(1).trim();
            const parts = content.split(urlRegex);
            
            return (
              <div key={i} className="flex items-start ml-2">
                <span className="text-white mr-2">•</span>
                <span className="text-white">
                  {parts.map((part, j) => {
                    if (part.match(urlRegex)) {
                      return (
                        <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline">
                          {part}
                        </a>
                      );
                    }
                    return part;
                  })}
                </span>
              </div>
            );
          }
          
          // Regular text with potential URLs
          const parts = trimmed.split(urlRegex);
          
          return (
            <p key={i} className="mb-1 text-white">
              {parts.map((part, j) => {
                if (part.match(urlRegex)) {
                  return (
                    <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline">
                      {part}
                    </a>
                  );
                }
                // Bold text
                if (part.includes('**')) {
                  const boldParts = part.split('**');
                  return boldParts.map((boldPart, k) => 
                    k % 2 === 1 ? <strong key={k} className="text-white font-bold">{boldPart}</strong> : boldPart
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  // --- main send message flow ---
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMessage = { text, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // 1) detect language
      const lang = await detectLanguage(text);

      // 2) build prompt with enforced language
      const systemPrompt = buildSystemPrompt(lang);

      // Prepare the conversation history for the model
      const conversationMessages = [
        { role: "system", content: systemPrompt }
      ];

      // Add previous messages (excluding welcome messages)
      messages
        .filter(m => !m.isWelcome)
        .forEach(m => {
          conversationMessages.push({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          });
        });

      // Add current user message
      conversationMessages.push({
        role: 'user',
        content: text
      });

      // Call Groq API
      const res = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Using the recommended replacement model
          messages: conversationMessages,
          max_tokens: 800,
          temperature: 0.1
        }),
      });

      if (!res.ok) {
        let bodyTxt = "";
        try { bodyTxt = await res.text(); } catch (e) {}
        console.error("Groq API error", res.status, bodyTxt);
        
        // Check if it's a deprecation error
        if (bodyTxt.includes("deprecated") || bodyTxt.includes("decommissioned")) {
          throw new Error("The model used has been deprecated. Please update the model in the code.");
        }
        
        const friendly = res.status === 401 || res.status === 403 ? `API key error (${res.status}).` : `Groq API returned ${res.status}.`;
        throw new Error(friendly);
      }

      const data = await res.json();
      let reply = "";
      
      if (data.choices && data.choices.length > 0) {
        reply = data.choices[0].message.content.trim();
      } else {
        reply = "Sorry, I couldn't generate a response.";
      }

      setMessages((prev) => [...prev, { text: reply, sender: "bot", timestamp: new Date() }]);
    } catch (err) {
      console.error("generate error", err);
      setMessages((prev) => [...prev, { text: err?.message || "Temporary problem connecting to AI service.", sender: "bot", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {showNotification && !isOpen && (
        <div className="absolute bottom-20 right-0 bg-gray-300 text-gray-900 text-sm rounded-lg px-4 py-3 shadow-lg transition-all duration-300 animate-bounce cursor-pointer max-w-xs border border-purple-600" onClick={handleNotificationClick}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">StudyNotion Assistant</p>
              <p className="text-xs text-gray-700">Need help finding a course? I'm here to assist!</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={toggleChat} aria-label="Toggle chat" className={`w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-purple-700 focus:outline-none border border-purple-700 ${isOpen ? "rotate-45" : ""}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <div className={`absolute bottom-20 right-0 w-80 md:w-96 h-[520px] bg-black rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform border border-purple-900 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="bg-black text-white p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
            <h3 className="font-semibold text-white">StudyNotion Assistant</h3>
          </div>
          <button onClick={toggleChat} className="text-gray-400 hover:text-white focus:outline-none" aria-label="Close chat">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-black">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white">
              <div className="bg-gray-800 p-4 rounded-full mb-4 border border-purple-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">StudyNotion Assistant</h3>
              <p className="text-center px-4 text-white">Ask me about courses, pricing, or how to navigate our platform. I support multiple languages!</p>
            </div>
          ) : (
            messages.map((message, i) => (
              <div key={i} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs md:max-w-md rounded-xl px-4 py-2 ${message.sender === "user" ? "bg-purple-900 text-white rounded-br-none" : message.isWelcome ? "bg-gray-800 border border-purple-800 rounded-bl-none" : "bg-gray-800 border border-gray-700 rounded-bl-none"}`}>
                  {message.sender === "bot" ? (
                    <div className="text-sm text-white">
                      {formatBotMessage(message.text)}
                      <p className={`text-xs mt-1 ${message.isWelcome ? "text-white" : "text-white"}`}>{formatTime(message.timestamp)}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white" style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                      <p className="text-xs mt-1 text-white">{formatTime(message.timestamp)}</p>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-700 p-4 bg-black">
          <div className="flex items-center">
            <button onClick={handleVoiceToggle} className={`p-2 rounded-full mr-2 ${isListening ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"}`} aria-label={isListening ? "Stop voice input" : "Start voice input"}>🎤</button>

            <textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Ask about courses or pricing..." 
              className="flex-1 bg-white text-black border border-gray-600 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none placeholder-gray-500" 
              rows={1} 
              disabled={isLoading}
              style={{color: "#000000"}}
            />

            <button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()} className={`ml-2 p-2 rounded-full ${inputText.trim() && !isLoading ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-700 text-gray-400"}`} aria-label="Send message">➤</button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">I can help you find courses, explain pricing, and navigate the platform.</p>
        </div>
      </div>
    </div>
  );
};

export default ElearningChatbot;