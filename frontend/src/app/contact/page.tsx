"use client";

import React from "react";
import styles from "./Contact.module.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  MapPin, Phone, Mail, Send, Clock, Users, Calendar, 
  AlertCircle, ChevronDown, MessageCircle, ArrowRight, Plus, Expand, LocateFixed, HelpCircle, Minus
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const faqs = [
  { question: "How do I book a tour?", answer: "You can book directly through our website by browsing our available tours, selecting your preferred dates, and following the checkout process." },
  { question: "Do you support offline booking?", answer: "Yes, you can visit our office in Durame or contact our support team via phone to arrange an offline booking." },
  { question: "Can I cancel my booking?", answer: "Yes, cancellations are allowed up to 48 hours before the tour start date for a full refund. Please review our cancellation policy for more details." },
  { question: "Is transportation included?", answer: "Transportation from the meeting point to the destination is typically included in most of our tour packages. Please check the specific tour details." },
  { question: "Are guides local?", answer: "Absolutely! All our guides are experienced locals who know the Kambata Zone intimately, ensuring you get an authentic and enriching experience." }
];

const ContactPage = () => {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const translatedFaqs = [
    { question: t("contactPage.faq.questions.0.q"), answer: t("contactPage.faq.questions.0.a") },
    { question: t("contactPage.faq.questions.1.q"), answer: t("contactPage.faq.questions.1.a") },
    { question: t("contactPage.faq.questions.2.q"), answer: t("contactPage.faq.questions.2.a") },
    { question: t("contactPage.faq.questions.3.q"), answer: t("contactPage.faq.questions.3.a") },
    { question: t("contactPage.faq.questions.4.q"), answer: t("contactPage.faq.questions.4.a") }
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header theme="dark" />

      <main className={styles.mainContent}>
        {/* ── 1. Hero Section ── */}
        <div className={styles.heroContainer}>
          <img loading="eager" fetchPriority="high" 
            src={"https://res.cloudinary.com/dzf4st3t2/image/upload/v1781974271/Gemini_Generated_Image_9u8k9z9u8k9z9u8k_c8mfjb.png".replace('/upload/', '/upload/f_auto,q_auto,w_1920/')} 
            className={styles.heroBg} 
            alt="Contact Hero" 
          />
          <div className={styles.heroOverlay} />
          
          <div className={styles.heroContent}>
            <span className={styles.heroTag}>{t("contactPage.hero.tag")}</span>
            <h1 className={styles.heroTitle}>{t("contactPage.hero.title")}</h1>
            <p className={styles.heroSub}>
              {t("contactPage.hero.sub")}
            </p>
          </div>

          <div className={styles.heroContactRow}>
            <div className={styles.heroContactItem}>
              <div className={styles.heroContactIcon}><MapPin size={20} /></div>
              <div className={styles.heroContactText}>
                <span className={styles.heroContactLabel}>{t("contactPage.hero.location")}</span>
                <span className={styles.heroContactValue}>{t("contactPage.hero.locationValue")}</span>
              </div>
            </div>
            <div className={styles.heroContactItem}>
              <div className={styles.heroContactIcon}><Phone size={20} /></div>
              <div className={styles.heroContactText}>
                <span className={styles.heroContactLabel}>{t("contactPage.hero.phone")}</span>
                <span className={styles.heroContactValue}>+251 911 123 456</span>
              </div>
            </div>
            <div className={styles.heroContactItem}>
              <div className={styles.heroContactIcon}><Mail size={20} /></div>
              <div className={styles.heroContactText}>
                <span className={styles.heroContactLabel}>{t("contactPage.hero.email")}</span>
                <span className={styles.heroContactValue}>support@kambatatravel.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Container ── */}
        <div className={styles.contentContainer}>
          
          {/* ── Top Grid (Form + Help) ── */}
          <ScrollReveal delay={0.1}>
          <div className={styles.topGrid}>
            
            {/* Form */}
            <div className={styles.formCard}>
              <img 
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                alt="Kambata Travel" 
                className="h-8 w-auto mb-4 object-contain opacity-80" 
              />
              <h2>{t("contactPage.form.title")}</h2>
              <form>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("contactPage.form.name")}</label>
                    <input type="text" className={styles.formInput} placeholder={t("contactPage.form.namePlace")} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("contactPage.form.email")}</label>
                    <input type="email" className={styles.formInput} placeholder={t("contactPage.form.emailPlace")} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("contactPage.form.phone")}</label>
                    <input type="text" className={styles.formInput} placeholder={t("contactPage.form.phonePlace")} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("contactPage.form.subject")}</label>
                    <div style={{ position: "relative" }}>
                      <select className={styles.formInput} style={{ width: "100%", appearance: "none" }}>
                        <option>{t("contactPage.form.subjectSelect")}</option>
                        <option>{t("contactPage.form.subjectTour")}</option>
                        <option>{t("contactPage.form.subjectGeneral")}</option>
                      </select>
                      <ChevronDown size={16} style={{ position: "absolute", right: 16, top: 16, color: "#94a3b8", pointerEvents: "none" }} />
                    </div>
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>{t("contactPage.form.message")}</label>
                    <textarea className={styles.formInput} rows={4} placeholder={t("contactPage.form.messagePlace")}></textarea>
                  </div>
                </div>
                <button type="button" className={styles.submitBtn}>
                  <Send size={18} /> {t("contactPage.form.send")}
                </button>
              </form>
            </div>

            {/* Help Card */}
            <div className={styles.helpCard}>
              <h2>{t("contactPage.help.title")}</h2>
              <div className={styles.helpList}>
                <div className={styles.helpItem}>
                  <div className={styles.helpIcon}><Phone size={20} /></div>
                  <div className={styles.helpText}>
                    <h4>{t("contactPage.help.support.title")}</h4>
                    <p>{t("contactPage.help.support.desc")}</p>
                  </div>
                </div>
                <div className={styles.helpItem}>
                  <div className={styles.helpIcon}><Users size={20} /></div>
                  <div className={styles.helpText}>
                    <h4>{t("contactPage.help.guide.title")}</h4>
                    <p>{t("contactPage.help.guide.desc")}</p>
                  </div>
                </div>
                <div className={styles.helpItem}>
                  <div className={styles.helpIcon}><Calendar size={20} /></div>
                  <div className={styles.helpText}>
                    <h4>{t("contactPage.help.booking.title")}</h4>
                    <p>{t("contactPage.help.booking.desc")}</p>
                  </div>
                </div>
                <div className={styles.helpItem}>
                  <div className={styles.helpIcon}><MapPin size={20} /></div>
                  <div className={styles.helpText}>
                    <h4>{t("contactPage.help.emergency.title")}</h4>
                    <p>{t("contactPage.help.emergency.desc")}</p>
                  </div>
                </div>
                <div className={styles.helpItem}>
                  <div className={styles.helpIcon}><Clock size={20} /></div>
                  <div className={styles.helpText}>
                    <h4>{t("contactPage.help.reply.title")}</h4>
                    <p>{t("contactPage.help.reply.desc")}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
          </ScrollReveal>

          {/* ── Methods Row ── */}
          <ScrollReveal>
          <div className={styles.methodsRow}>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><MapPin size={24} /></div>
              <div className={styles.methodText}>
                <span className={styles.methodTitle}>{t("contactPage.methods.visit.title")}</span>
                <span className={styles.methodDesc} dangerouslySetInnerHTML={{ __html: t("contactPage.methods.visit.desc") }}></span>
                <a href="#" className={styles.methodLink}>{t("contactPage.methods.visit.link")} <ArrowRight size={14} /></a>
              </div>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><Phone size={24} /></div>
              <div className={styles.methodText}>
                <span className={styles.methodTitle}>{t("contactPage.methods.call.title")}</span>
                <span className={styles.methodDesc}>{t("contactPage.methods.call.desc")}</span>
                <span className={styles.methodValue}>+251 911 123 456</span>
                <a href="#" className={styles.methodLink}>{t("contactPage.methods.call.link")} <ArrowRight size={14} /></a>
              </div>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><Mail size={24} /></div>
              <div className={styles.methodText}>
                <span className={styles.methodTitle}>{t("contactPage.methods.email.title")}</span>
                <span className={styles.methodDesc}>{t("contactPage.methods.email.desc")}</span>
                <span className={styles.methodValue}>support@kambatatravel.com</span>
                <a href="#" className={styles.methodLink}>{t("contactPage.methods.email.link")} <ArrowRight size={14} /></a>
              </div>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><MessageCircle size={24} /></div>
              <div className={styles.methodText}>
                <span className={styles.methodTitle}>{t("contactPage.methods.whatsapp.title")}</span>
                <span className={styles.methodDesc} dangerouslySetInnerHTML={{ __html: t("contactPage.methods.whatsapp.desc") }}></span>
                <a href="#" className={styles.methodLink}>{t("contactPage.methods.whatsapp.link")} <ArrowRight size={14} /></a>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* ── Map Section ── */}
          <ScrollReveal>
          <div className={styles.mapSection}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126668.61803738012!2d37.84274983359677!3d7.234394145946356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b1b369ba0f4f9f%3A0x6b14d2e85a5fc56d!2sDurame%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1714578119022!5m2!1sen!2sus" 
              className={styles.realMapIframe}
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            <div className={`${styles.mapContent} bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/20 z-10`} style={{ pointerEvents: 'auto' }}>
              <img 
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                alt="Kambata Travel" 
                className="h-8 w-auto mb-3 object-contain" 
              />
              <h2 className="text-[#1a1a1a] text-xl font-bold mb-1">{t("contactPage.map.title")}</h2>
              <p className="text-gray-600 mb-4 text-xs">{t("contactPage.map.desc")}</p>
              <a href="https://maps.google.com/?q=Durame,Ethiopia" target="_blank" rel="noopener noreferrer" className="bg-[#13382D] text-white px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#0f2d24] transition-colors">
                <MapPin size={16} /> {t("contactPage.map.btn")}
              </a>
            </div>
          </div>
          </ScrollReveal>

          {/* ── FAQ Section ── */}
          <ScrollReveal>
          <div className={styles.faqSection}>
            <div className={styles.faqHeader}>
              <h2 className={styles.faqTitle}>{t("contactPage.faq.title")}</h2>
              <span className={styles.faqContactLink} dangerouslySetInnerHTML={{ __html: t("contactPage.faq.contactLink") + ' <ArrowRight size="14" style="display: inline; vertical-align: middle;" />' }}></span>
            </div>
            <div className={styles.faqGrid}>
              {translatedFaqs.map((faq, index) => (
                <div key={index} className={`${styles.faqItem} ${openFaq === index ? styles.faqOpen : ''}`} onClick={() => toggleFaq(index)}>
                  <div className={styles.faqItemHeader}>
                    <div className={styles.faqItemLeft}>
                      <HelpCircle size={18} className={styles.faqIcon} />
                      <span className={styles.faqQuestion}>{faq.question}</span>
                    </div>
                    {openFaq === index ? <Minus size={18} color="#C89B3C" /> : <Plus size={18} color="#94a3b8" />}
                  </div>
                  {openFaq === index && (
                    <div className={styles.faqAnswer}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          </ScrollReveal>

          {/* ── Urgent Banner ── */}
          <ScrollReveal>
          <div className={styles.urgentBanner}>
            <div className={styles.urgentLeft}>
              <div className={styles.urgentIconBox}>
                <AlertCircle size={28} />
              </div>
              <div className={styles.urgentText}>
                <h3>{t("contactPage.urgent.title")}</h3>
                <p>{t("contactPage.urgent.desc")}</p>
              </div>
            </div>
            <div className={styles.urgentRight}>
              <button className={styles.urgentBtn}>
                <Phone size={16} /> {t("contactPage.urgent.call")}
              </button>
              <button className={styles.urgentBtn}>
                <MessageCircle size={16} /> {t("contactPage.urgent.whatsapp")}
              </button>
              <div className={styles.urgentHotline}>
                <span className={styles.urgentHotlineLabel}>{t("contactPage.urgent.hotline")}</span>
                <span className={styles.urgentHotlineNum}>+251 911 123 456</span>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* ── Bottom Banner ── */}
          <ScrollReveal>
          <div className={styles.bottomBanner}>
            <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" className={styles.bottomBannerBg} alt="Start Journey" />
            <div className={styles.bottomBannerOverlay} />
            <div className={styles.bottomBannerContent}>
              <h2>{t("contactPage.bottomBanner.title")}</h2>
              <p>{t("contactPage.bottomBanner.desc")}</p>
              <div className={styles.bottomBannerBtns}>
                <Link href="/tours" className={styles.btnPrimary}>{t("contactPage.bottomBanner.btnTours")} <ArrowRight size={16} style={{display: "inline", verticalAlign: "middle", marginLeft: 4}} /></Link>
                <Link href="/explore" className={styles.btnSecondary}>{t("contactPage.bottomBanner.btnDestinations")} <ArrowRight size={16} style={{display: "inline", verticalAlign: "middle", marginLeft: 4}} /></Link>
              </div>
            </div>
          </div>
          </ScrollReveal>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
