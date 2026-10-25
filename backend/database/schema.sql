--
-- PostgreSQL database dump
--

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-24 22:19:42

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16434)
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idempotency_keys (
    key character varying(255) NOT NULL,
    request_hash character varying(64) NOT NULL,
    reservation_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    total_quantity integer NOT NULL,
    available_quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_available_quantity CHECK (((available_quantity >= 0) AND (available_quantity <= total_quantity))),
    CONSTRAINT chk_total_quantity CHECK ((total_quantity >= 0))
);

--
-- TOC entry 220 (class 1259 OID 16408)
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reservations_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT reservations_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'RELEASED'::character varying, 'EXPIRED'::character varying])::text[])))
);

--
-- TOC entry 4784 (class 2606 OID 16443)
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (key);


--
-- TOC entry 4786 (class 2606 OID 16445)
-- Name: idempotency_keys idempotency_keys_reservation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_reservation_id_key UNIQUE (reservation_id);


--
-- TOC entry 4776 (class 2606 OID 16405)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 16407)
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- TOC entry 4782 (class 2606 OID 16426)
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- TOC entry 4779 (class 1259 OID 16433)
-- Name: idx_reservations_pending_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservations_pending_expiry ON public.reservations USING btree (expires_at) WHERE ((status)::text = 'PENDING'::text);


--
-- TOC entry 4780 (class 1259 OID 16432)
-- Name: idx_reservations_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservations_product_id ON public.reservations USING btree (product_id);


--
-- TOC entry 4788 (class 2606 OID 16446)
-- Name: idempotency_keys idempotency_keys_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE RESTRICT;


--
-- TOC entry 4787 (class 2606 OID 16427)
-- Name: reservations reservations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


-- Completed on 2026-10-24 22:19:43

--
-- PostgreSQL database dump complete
--
