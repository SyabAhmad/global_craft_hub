import React from "react";
import { motion } from "framer-motion";
import teanMember from "../assets/khalil.jpg";


const AboutPage = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };
  const handleContactUsButton = () => {
    window.location.href = "/contact";
  }
  const handleOrderNowButton = () => {
    window.location.href = "/manage-products";
  }

  return (
    <div className="min-h-screen bg-[#fff9f5]">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Bakery Kitchen"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Story
            </h1>
            <div className="w-24 h-1 bg-[#d3756b] mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Mission & Values */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#5e3023] mb-6">
            Our Mission & Values
          </h2>
          <p className="text-[#8c5f53] text-lg max-w-3xl mx-auto leading-relaxed">
            At Global Craft Hub, we believe every moment deserves something extraordinary.
Our mission is to create not just art, but lasting memories to be cherished for a lifetime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-[#f8e8e0] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#d3756b]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#5e3023] mb-3">
              Crafted with Quality
            </h3>
            <p className="text-[#8c5f53]">
              We use only the finest materials, ensuring each piece is not just visually stunning but crafted to last.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-[#f8e8e0] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#d3756b]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#5e3023] mb-3">
              Artisanal Craftsmanship
            </h3>
            <p className="text-[#8c5f53]">
              Each artwork is handcrafted with precision, creativity, and meticulous attention to detail by our skilled artists.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-[#f8e8e0] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#d3756b]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#5e3023] mb-3">
              Customer Happiness
            </h3>
            <p className="text-[#8c5f53]">
              Your satisfaction is our priority. We go above and beyond to make
              your experience memorable.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Our Journey */}
      <div className="bg-[#f8e8e0] py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-6xl mx-auto px-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1026&q=80"
                alt="Our Journey"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#5e3023] mb-6">
                Our Journey
              </h2>
              <div className="w-16 h-1 bg-[#d3756b] mb-6"></div>
              <p className="text-[#8c5f53] mb-4 leading-relaxed">
                Global Craft Hub began as a small family-run art studio in Swat, Pakistan in 2010. 
  What started as a passion project soon blossomed into a beloved local space for creativity, 
  known for offering the most captivating and handcrafted artworks in the region.
              </p>
              <p className="text-[#8c5f53] mb-4 leading-relaxed">
                Over the years, we've expanded our offerings and presence, but our commitment to quality and 
  artistic integrity has never wavered. Each creation still receives the same care, precision, 
  and soul as it did on day one.
              </p>
              <p className="text-[#8c5f53] leading-relaxed">
                Today, we are proud to serve communities across Pakistan, bringing our artful expressions 
  into homes, events, and personal spaces — big and small. Our journey continues as we innovate, 
  inspire, and honor the craftsmanship that made us who we are.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Meet the Team */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#5e3023] mb-3">
            Meet Our Team
          </h2>
          <div className="w-24 h-1 bg-[#d3756b] mx-auto mb-6"></div>
          <p className="text-[#8c5f53] text-lg max-w-3xl mx-auto">
            The passionate artists behind our handcrafted creations
          </p>
        </div>

        <div className="space-y-8">
          {/* Team Member 1 */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-lg shadow-md">
            <div className="w-48 h-48 overflow-hidden rounded-lg flex-shrink-0">
              <img
                src={teanMember}
                alt="Khalil Ur Rahman"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#5e3023] mb-2">
                Khalil Ur Rahman
              </h3>
              <p className="text-[#8c5f53] mb-4">Full Stack Developer & Founder</p>
              <p className="text-[#8c5f53] mb-4">Department of Computer and Software Technology</p>
              <p className="text-[#8c5f53] mb-4">University of Swat</p>
              <div className="flex justify-center md:justify-start space-x-4">
                {/* <a href="#" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                  </svg>
                </a> */}
                <a href="https://www.linkedin.com/in/syedkhalil" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z" />
                  </svg>
                </a>
                <a href="https://www.facebook.com/syedkhalil" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Team Member 2 */}
          {/* <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-lg shadow-md">
            <div className="w-48 h-48 overflow-hidden rounded-lg flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1603638833522-0165d178cd5d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI2fHxjb3ZlciUyMGZhY2UlMjB3aXRoJTIwaGlqYWIlMjBmZ2lybHMlMjBpbWFnZXN8ZW58MHx8MHx8fDA%3D"
                alt="Nosheen Bibi"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#5e3023] mb-2">
                Nosheen Bibi
              </h3>
              <p className="text-[#8c5f53] mb-4">Creative Designer and Front-end Developer</p>
              <p className="text-[#8c5f53] mb-4">Department of Computer and Software Technology</p>
              <p className="text-[#8c5f53] mb-4">University of Swat</p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href="#" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                  </svg>
                </a>
                <a href="#" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z" />
                  </svg>
                </a>
                <a href="#" className="text-[#d3756b] hover:text-[#c25d52]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z" />
                  </svg>
                </a>
              </div>
            </div>
          </div> */}
        </div>
      </motion.div>

      {/* Testimonials */}
      <div className="bg-[#f8e8e0] py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-6xl mx-auto px-6"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#5e3023] mb-3">
              What Our Customers Say
            </h2>
            <div className="w-24 h-1 bg-[#d3756b] mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Amina Tahir",
                quote:
                  "The custom artwork they made for my daughter was beyond my expectations. Not only was it beautifully crafted, but it truly captured her personality too!",
                location: "Islamabad",
              },
              {
                name: "Imran Khalid",
                quote:
                  "I've ordered multiple times from Global Craft Hub and they never disappoint. Their attention to detail is truly impeccable.",
                location: "Lahore",
              },
              {
                name: "Saira Malik",
                quote:
                  "My wedding cake was the talk of the event! Bake House truly made our special day even more memorable.",
                location: "Karachi",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
                <p className="text-[#8c5f53] italic mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-[#5e3023]">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-[#8c5f53]">
                      {testimonial.location}
                    </p>
                  </div>
                  <div className="text-[#d3756b]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="bg-[#5e3023] text-white text-center py-16 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Turn Moments into Masterpieces?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Celebrate life’s moments with art that speaks from the heart.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={handleOrderNowButton} className="bg-white text-[#5e3023] hover:bg-gray-100 px-8 py-3 rounded-full font-bold transition-colors">
              Order Now
            </button>
            <button onClick={handleContactUsButton} className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-8 py-3 rounded-full font-bold transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
