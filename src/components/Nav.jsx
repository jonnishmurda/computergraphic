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
            <div className={style.buttons}>
                <div className={style.dropdown}>
                    <button className={style.dropbtn}>Verkefni</button>
                    <div className={style.dropdownContent}>
                        <Link to="#">Verkefni 1</Link>
                    </div>
                </div>
                <div className={style.dropdown}>
                    <button className={style.dropbtn}>Heimadæmi</button>
                    <div className={style.dropdownContent}>
                        <Link to="#">Heimadæmi 2</Link>
                    </div>
                </div>
            </div>

        </header>

    )
}

export default Nav
