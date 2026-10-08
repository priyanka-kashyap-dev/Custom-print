"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send, Mic, Smile } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import styles from "./Contact.module.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    product: "Custom T-Shirt",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onEmojiClick = (emojiObject: any) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message + emojiObject.emoji,
    }));
    setShowEmojiPicker(false);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support voice input.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        message: prev.message + (prev.message ? " " : "") + transcript,
      }));
    };
    
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          product: "Custom T-Shirt",
          message: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Get In <span className="text-gradient">Touch</span>
          </motion.h2>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ready to create your custom gift? Fill out the form below and we&apos;ll get back to you shortly.
          </motion.p>
        </div>

        <motion.div 
          className={styles.formContainer}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {submitStatus === "success" ? (
            <div className={styles.successState}>
              <CheckCircle2 size={64} className={styles.successIcon} />
              <h3>Thank You!</h3>
              <p>Your request has been received. We&apos;ll get back to you soon.</p>
              <button 
                className={styles.resetButton}
                onClick={() => setSubmitStatus("idle")}
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <div className={styles.inputField}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>
                <div className={styles.inputField}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputField}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className={styles.inputField}>
                  <label htmlFor="product">Interested Product</label>
                  <select
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                  >
                    <option value="Custom T-Shirt">Custom T-Shirt</option>
                    <option value="Personalized Cushion">Personalized Cushion</option>
                    <option value="Heart Cushion">Heart Cushion</option>
                    <option value="Couple Gift">Couple Gift</option>
                    <option value="Photo Gift">Photo Gift</option>
                    <option value="Other/Custom Design">Other / Custom Design</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputField}>
                <label htmlFor="message">Your Message</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your custom design or any special requirements..."
                    style={{ paddingRight: '70px' }}
                  ></textarea>
                  
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={startListening} 
                      style={{ background: 'transparent', color: isListening ? 'var(--error-color)' : 'var(--text-light)', border: 'none', cursor: 'pointer', padding: 0 }} 
                      title="Voice to Text"
                    >
                      <Mic size={20} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      style={{ background: 'transparent', color: 'var(--text-light)', border: 'none', cursor: 'pointer', padding: 0 }} 
                      title="Add Emoji"
                    >
                      <Smile size={20} />
                    </button>
                  </div>

                  {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: '40px', right: '0', zIndex: 10 }}>
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
              </div>

              {submitStatus === "error" && (
                <div className={styles.errorMessage}>
                  Failed to send your request. Please try again later.
                </div>
              )}

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={styles.spinner} size={20} />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Request <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
