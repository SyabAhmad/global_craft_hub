import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import contactusimage from "../assets/contactus.jpg";
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const navigate = useNavigate();
  const chatInputRef = useRef(null);
  const modalRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setSubmitted(false);
    }, 3000);
  };

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatMessage("");
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      console.log("Chat message sent:", chatMessage);
      setChatMessage("");
      alert("Message sent! We'll get back to you soon.");
    }
  };

  // Focus input when chat opens and handle Escape key
  useEffect(() => {
    if (isChatOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
    const handleEscape = (e) => {
      if (e.key === "Escape" && isChatOpen) {
        closeChat();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isChatOpen]);

  // Close modal if clicked outside
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeChat();
    }
  };

  return (
    <div className="min-h-screen bg-[#064232]">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={contactusimage}
          alt="Contact Us"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Contact Us
            </h1>
            <div className="w-24 h-1 bg-[#d3756b] mx-auto"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-white text-lg max-w-3xl mx-auto">
            Have questions about our products or services? We'd love to hear
            from you! Fill out the form below and we'll get back to you as soon
            as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-[#5e3023] mb-6">
                Contact Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#d3756b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#5e3023]">
                      Our Location
                    </h4>
                    <p className="text-[#8c5f53] mt-1">
                      Mingora, Swat, Pakistan
                    </p>
                    <p className="text-[#8c5f53]">
                      Also in Islamabad, Lahore & Karachi
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#d3756b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#5e3023]">
                      Phone Number
                    </h4>
                    <p className="text-[#8c5f53] mt-1">+92 344 9992551</p>
                    <p className="text-[#8c5f53]">Mon-Sat 9:00 AM - 8:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#d3756b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#5e3023]">
                      Email Address
                    </h4>
                    <p className="text-[#8c5f53] mt-1">
                      info@crafthub.com
                    </p>
                    <p className="text-[#8c5f53]">We respond within 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <h4 className="font-semibold text-[#5e3023] mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center text-[#d3756b] hover:bg-[#d3756b] hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center text-[#d3756b] hover:bg-[#d3756b] hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center text-[#d3756b] hover:bg-[#d3756b] hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 rounded-full bg-[#f8e8e0] flex items-center justify-center text-[#d3756b] hover:bg-[#d3756b] hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-[#5e3023] mb-6">
                Send Us a Message
              </h3>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-lg text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-green-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h4 className="text-xl font-bold mb-2">
                    Message Sent Successfully!
                  </h4>
                  <p>
                    Thank you for contacting us. We'll respond to your message
                    shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-[#5e3023] font-medium mb-2"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[#5e3023] font-medium mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-[#5e3023] font-medium mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                        placeholder="+92 XXX XXXXXXX"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-[#5e3023] font-medium mb-2"
                      >
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                        placeholder="How can we help you?"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className="block text-[#5e3023] font-medium mb-2"
                    >
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] min-h-[150px]"
                      placeholder="Tell us about your inquiry or feedback..."
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#8c7c68] hover:bg-[#c25d52] text-white py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
                  >
                    SEND MESSAGE
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mb-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-lg overflow-hidden shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d423286.27406841926!2d72.04012522066643!3d34.82141548764968!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dc0654587d1321%3A0xcf3cab48cec76a25!2sSwat%2C%20Khyber%20Pakhtunkhwa%2C%20Pakistan!5e0!3m2!1sen!2sus!4v1653371604061!5m2!1sen!2sus"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sweet Indulgence Location"
            ></iframe>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[#064232] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Frequently Asked Questions
            </h2>
            <div className="w-24 h-1 bg-[#d3756b] mx-auto mb-6"></div>
            <p className="text-white">
              Find quick answers to common questions about our services
            </p>
          </div>
          <div className="space-y-6">
            {[
              {
                question: "How far in advance should I order a custom cake?",
                answer:
                  "We recommend placing your order at least 7-10 days in advance for custom cakes. For wedding cakes or large events, please book 3-4 weeks ahead to ensure availability.",
              },
              {
                question: "Do you deliver cakes?",
                answer:
                  "Yes, we offer delivery services within city limits. Delivery fees vary based on distance. You can also pick up your order at any of our store locations.",
              },
              {
                question: "What if I need to cancel my order?",
                answer:
                  "Cancellations made 48 hours or more before pickup/delivery date are eligible for a full refund. For cancellations within 48 hours, a 50% cancellation fee applies.",
              },
              {
                question: "Do you accommodate dietary restrictions?",
                answer:
                  "Absolutely! We offer gluten-free, eggless, and sugar-free options. Please inform us of any allergies or dietary restrictions when placing your order.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-bold text-[#5e3023] mb-3">
                  {faq.question}
                </h4>
                <p className="text-[#8c5f53]">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-white mb-4">Still have questions?</p>
            <button
              onClick={openChat}
              className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-8 py-3 rounded-full font-bold transition-colors inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Chat With Us
            </button>
          </div>
        </div>
      </div>

      {/* Chat Popup Modal */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300"
          onClick={handleClickOutside}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 transform transition-all duration-300 scale-100 sm:scale-105"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#5e3023]">Chat with Us</h3>
              <button
                onClick={closeChat}
                className="text-[#8c5f53] hover:text-[#d3756b] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="bg-[#f8e8e0] rounded-lg p-4 mb-4 h-64 overflow-y-auto">
              <p className="text-[#5e3023] text-sm italic">
                Start typing your message below...
              </p>
            </div>
            <form
              onSubmit={handleChatSubmit}
              className="flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="bg-[#d3756b] hover:bg-[#c25d52] text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;
