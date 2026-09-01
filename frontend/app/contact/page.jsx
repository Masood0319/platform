"use client";

import { useState } from "react";
import { Mail, Clock } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import { submitContactMessage } from "@/lib/services/contactService";

const CONTACT_EMAIL = "hello@fundraise.example";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", honeypot: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage(form);
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "", honeypot: "" });
    } catch (error) {
      showToast(error.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PublicNavbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Get in touch</h1>
          <p className="mt-3 text-[var(--text-muted)]">
            Questions about the platform, partnerships, or press? We'd love to hear from you.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <Card>
              <div className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 flex-shrink-0 text-[var(--primary)]" />
                <div>
                  <CardTitle>Email us directly</CardTitle>
                  <CardDescription className="mt-1">
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--primary)] hover:underline">
                      {CONTACT_EMAIL}
                    </a>
                  </CardDescription>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-3">
                <Clock size={20} className="mt-0.5 flex-shrink-0 text-[var(--primary)]" />
                <div>
                  <CardTitle>Response time</CardTitle>
                  <CardDescription className="mt-1">
                    We typically reply within 1-2 business days.
                  </CardDescription>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-lg font-semibold text-[var(--text-main)]">Message sent 🎉</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Thanks for reaching out - we'll get back to you soon.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange("name")}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={form.email}
                    onChange={handleChange("email")}
                    required
                  />
                </div>
                <Input
                  placeholder="Subject (optional)"
                  value={form.subject}
                  onChange={handleChange("subject")}
                />
                <Textarea
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={handleChange("message")}
                  maxLength={5000}
                  required
                  className="min-h-40"
                />
                {/* Honeypot field - hidden from real users, bots tend to fill it in */}
                <input
                  type="text"
                  name="company"
                  value={form.honeypot}
                  onChange={handleChange("honeypot")}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}