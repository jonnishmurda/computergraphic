import React from 'react'
import { Link } from 'react-router-dom'
import style from './Nav.module.css'

function Nav() {
    return (
        <header>
            <div>
                <h1>TÖL105G - Tölvugrafík Verkefni</h1>
                <h2>Jonathan Jakub Otuoma - <a href="mailto:jjo1@hi.is">jjo1@hi.is</a></h2>
            </div>
            <div className={style.dropdown}>
                <button className={style.dropbtn}>Verkefni</button>
                <div className={style.dropdownContent}>
                    <Link to="#">Verkefni 1</Link>
                    <Link to="#">Verkefni 2</Link>
                    <Link to="#">Verkefni 3</Link>
                </div>
            </div>

        </header>

    )
}

export default Nav
