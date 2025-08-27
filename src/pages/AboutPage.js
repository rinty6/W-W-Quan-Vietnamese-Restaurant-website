import "./AboutPage.css";

export default function AboutPage() {
  return (
    <section className="about-section">
      <div className="about-img-wrapper">
        <img
          src={require("../assets/image/All_dishes.jpeg")}
          alt="Banh mi and box"
          className="about-img"
        />
      </div>
      <div className="about-content">
        <h2 className="about-title">Our Story Over the last 10 years</h2>
        <div className="about-text">
          <p>
            Once upon a time, way back in 2015, the W&W Quan journey began with a teeny-tiny shop on Waymouth Street. It all started with a simple mission: to eat tasty, eat healthy, and make the world a happier place, one meal at a time. That humble beginning laid the foundation for something truly special.
          </p>
          <p>
            Flash forward almost 10 years, and while our little shop has grown and evolved—now proudly located at Shop T18 Ashwin Parade & South Rd, Torrensville SA 5031—our purpose remains as simple and meaningful as ever. 
          </p>
          <p>
            We’ve become a beloved staple in the community, serving up happiness one meal at a time. Through all the changes over the years, one thing has stayed the same: our commitment to serving tasty, healthy meals and spreading joy to everyone who walks through our door.
          </p>
        </div>
        <a href="/menu" className="about-menu-btn">View Menu</a>
      </div>
    </section>
  );
}