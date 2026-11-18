import React from "react";
import { FiHeart } from "react-icons/fi";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="tf-footer">
            <div className="tf-footer-bottom">
                <p>
                    © {new Date().getFullYear()} TaskFlow. All rights reserved.
                </p>

                <p className="tf-footer-made">
                    Made with <FiHeart /> for better productivity.
                </p>
            </div>
        </footer>
    );
};

export default Footer;