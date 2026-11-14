// Arena header: the brand, one plain line about what this is, and site links.
// Connection state is stated in words in the controls strip, not as a dot here.
const Header = () => (
    <header className="arena-wrap">
        <div className="arena-nav">
            <div>
                <a className="arena-brand" href="/">StanceStream</a>
                <p className="arena-tagline">A record of debates between two AI bots.</p>
            </div>
            <nav aria-label="Site">
                <a href="/arena" aria-current="page">Arena</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
            </nav>
        </div>
    </header>
);

export default Header;
