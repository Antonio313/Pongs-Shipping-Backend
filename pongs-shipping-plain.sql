--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-09-23 22:12:57

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 245 (class 1255 OID 41155)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 41105)
-- Name: daily_sales_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_sales_summary (
    summary_id integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    total_packages integer DEFAULT 0,
    total_revenue numeric(12,2) DEFAULT 0.00,
    total_customers_added integer DEFAULT 0,
    total_transfers_created integer DEFAULT 0,
    total_prealerts_confirmed integer DEFAULT 0,
    active_staff_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_sales_summary OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 41104)
-- Name: daily_sales_summary_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_sales_summary_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_sales_summary_summary_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 239
-- Name: daily_sales_summary_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_sales_summary_summary_id_seq OWNED BY public.daily_sales_summary.summary_id;


--
-- TOC entry 225 (class 1259 OID 16840)
-- Name: deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliveries (
    delivery_id integer NOT NULL,
    package_id character varying(10) NOT NULL,
    delivered_at timestamp without time zone,
    received_by character varying(100),
    delivered_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.deliveries OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16839)
-- Name: deliveries_delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deliveries_delivery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliveries_delivery_id_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 224
-- Name: deliveries_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deliveries_delivery_id_seq OWNED BY public.deliveries.delivery_id;


--
-- TOC entry 244 (class 1259 OID 41146)
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 41145)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 243
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 233 (class 1259 OID 41014)
-- Name: packagenotifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packagenotifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    admin_id integer NOT NULL,
    description text NOT NULL,
    weight numeric(5,2),
    tracking_number character varying(50),
    carrier character varying(50),
    notes text,
    notification_type character varying(20) DEFAULT 'missing_prealert'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.packagenotifications OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41013)
-- Name: packagenotifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packagenotifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packagenotifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 232
-- Name: packagenotifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packagenotifications_notification_id_seq OWNED BY public.packagenotifications.notification_id;


--
-- TOC entry 231 (class 1259 OID 16899)
-- Name: packagepayments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packagepayments (
    package_id character varying(10) NOT NULL,
    payment_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    CONSTRAINT packagepayments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.packagepayments OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16780)
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    package_id character varying(10) NOT NULL,
    user_id integer NOT NULL,
    tracking_number character varying(20) NOT NULL,
    weight numeric(5,2) NOT NULL,
    length numeric(5,2),
    width numeric(5,2),
    height numeric(5,2),
    description text,
    cost numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'Processing'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    finalcost numeric(10,2),
    CONSTRAINT packages_cost_check CHECK ((cost >= (0)::numeric)),
    CONSTRAINT packages_status_check CHECK (((status)::text = ANY ((ARRAY['Processing'::character varying, 'Delivered to Overseas Warehouse'::character varying, 'In Transit to Jamaica'::character varying, 'Arrived in Jamaica'::character varying, 'Arrived at Selected Branch'::character varying, 'Ready For Pickup'::character varying, 'Out for Delivery'::character varying, 'Delivered'::character varying, 'In Transit to Selected Branch'::character varying])::text[]))),
    CONSTRAINT packages_weight_check CHECK ((weight > (0)::numeric))
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16868)
-- Name: packageshipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packageshipments (
    package_id character varying(10) NOT NULL,
    shipment_id integer NOT NULL
);


ALTER TABLE public.packageshipments OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16820)
-- Name: packagetracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packagetracking (
    tracking_id integer NOT NULL,
    package_id character varying(10) NOT NULL,
    location character varying(100),
    status character varying(50) NOT NULL,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.packagetracking OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16819)
-- Name: packagetracking_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packagetracking_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packagetracking_tracking_id_seq OWNER TO postgres;

--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 222
-- Name: packagetracking_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packagetracking_tracking_id_seq OWNED BY public.packagetracking.tracking_id;


--
-- TOC entry 230 (class 1259 OID 16884)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    transaction_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16883)
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 229
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- TOC entry 221 (class 1259 OID 16801)
-- Name: prealerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prealerts (
    prealert_id integer NOT NULL,
    user_id integer NOT NULL,
    package_id character varying(10),
    description text,
    price numeric(10,2),
    invoice_url character varying(255),
    status character(1) DEFAULT 'U'::bpchar,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    s3_key character varying(500),
    CONSTRAINT prealerts_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT prealerts_status_check CHECK ((status = ANY (ARRAY['C'::bpchar, 'U'::bpchar])))
);


ALTER TABLE public.prealerts OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16800)
-- Name: prealerts_prealert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prealerts_prealert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prealerts_prealert_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 220
-- Name: prealerts_prealert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prealerts_prealert_id_seq OWNED BY public.prealerts.prealert_id;


--
-- TOC entry 227 (class 1259 OID 16860)
-- Name: shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipments (
    shipment_id integer NOT NULL,
    shipment_date date NOT NULL,
    origin character varying(100) NOT NULL,
    destination character varying(100) NOT NULL,
    carrier character varying(50),
    tracking_code character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipments OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16859)
-- Name: shipments_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipments_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipments_shipment_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 226
-- Name: shipments_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipments_shipment_id_seq OWNED BY public.shipments.shipment_id;


--
-- TOC entry 242 (class 1259 OID 41123)
-- Name: staff_actions_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_actions_log (
    log_id integer NOT NULL,
    staff_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(50),
    description text,
    revenue_impact numeric(10,2) DEFAULT 0.00,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_actions_log OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 41122)
-- Name: staff_actions_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_actions_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_actions_log_log_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 241
-- Name: staff_actions_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_actions_log_log_id_seq OWNED BY public.staff_actions_log.log_id;


--
-- TOC entry 238 (class 1259 OID 41082)
-- Name: staff_performance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_performance (
    performance_id integer NOT NULL,
    staff_id integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    packages_processed integer DEFAULT 0,
    transfers_created integer DEFAULT 0,
    customers_added integer DEFAULT 0,
    revenue_generated numeric(12,2) DEFAULT 0.00,
    prealerts_confirmed integer DEFAULT 0,
    notifications_sent integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_performance OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 41081)
-- Name: staff_performance_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_performance_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_performance_performance_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 237
-- Name: staff_performance_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_performance_performance_id_seq OWNED BY public.staff_performance.performance_id;


--
-- TOC entry 236 (class 1259 OID 41056)
-- Name: transfer_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transfer_packages (
    transfer_id integer NOT NULL,
    package_id character varying(10) NOT NULL,
    checked_off boolean DEFAULT false,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transfer_packages OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41038)
-- Name: transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transfers (
    transfer_id integer NOT NULL,
    destination character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'created'::character varying,
    notes text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transfers_destination_check CHECK (((destination)::text = ANY ((ARRAY['jamaica'::character varying, 'priory-branch'::character varying, 'ocho-rios-branch'::character varying, 'overseas-warehouse'::character varying])::text[]))),
    CONSTRAINT transfers_status_check CHECK (((status)::text = ANY ((ARRAY['created'::character varying, 'in_transit'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.transfers OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41037)
-- Name: transfers_transfer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transfers_transfer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transfers_transfer_id_seq OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 234
-- Name: transfers_transfer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transfers_transfer_id_seq OWNED BY public.transfers.transfer_id;


--
-- TOC entry 218 (class 1259 OID 16646)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    branch character varying(20) NOT NULL,
    role character(1) DEFAULT 'C'::bpchar NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_verified boolean DEFAULT false,
    verification_token character varying(255),
    verification_token_expires timestamp without time zone,
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    CONSTRAINT users_branch_check CHECK (((branch)::text = ANY ((ARRAY['Priory'::character varying, 'Ocho Rios'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['A'::bpchar, 'C'::bpchar, 'S'::bpchar])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16645)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4856 (class 2604 OID 41108)
-- Name: daily_sales_summary summary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sales_summary ALTER COLUMN summary_id SET DEFAULT nextval('public.daily_sales_summary_summary_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 16843)
-- Name: deliveries delivery_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN delivery_id SET DEFAULT nextval('public.deliveries_delivery_id_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 41149)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 41017)
-- Name: packagenotifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagenotifications ALTER COLUMN notification_id SET DEFAULT nextval('public.packagenotifications_notification_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 16823)
-- Name: packagetracking tracking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagetracking ALTER COLUMN tracking_id SET DEFAULT nextval('public.packagetracking_tracking_id_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 16887)
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- TOC entry 4822 (class 2604 OID 16804)
-- Name: prealerts prealert_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prealerts ALTER COLUMN prealert_id SET DEFAULT nextval('public.prealerts_prealert_id_seq'::regclass);


--
-- TOC entry 4830 (class 2604 OID 16863)
-- Name: shipments shipment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments ALTER COLUMN shipment_id SET DEFAULT nextval('public.shipments_shipment_id_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 41126)
-- Name: staff_actions_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_actions_log ALTER COLUMN log_id SET DEFAULT nextval('public.staff_actions_log_log_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 41085)
-- Name: staff_performance performance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_performance ALTER COLUMN performance_id SET DEFAULT nextval('public.staff_performance_performance_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 41041)
-- Name: transfers transfer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers ALTER COLUMN transfer_id SET DEFAULT nextval('public.transfers_transfer_id_seq'::regclass);


--
-- TOC entry 4814 (class 2604 OID 16649)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5138 (class 0 OID 41105)
-- Dependencies: 240
-- Data for Name: daily_sales_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5123 (class 0 OID 16840)
-- Dependencies: 225
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (2, 'PKG074864', '2025-09-15 21:11:28.151', 'Tazhara', 1, '', '2025-09-15 21:11:28.151498');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (1, 'PKG1000011', '2025-09-15 21:11:28.151', 'Tazhara', 1, '', '2025-09-15 21:11:28.151361');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (3, 'PKG1000015', '2025-09-15 21:11:28.189', 'Tazhara', 1, '', '2025-09-15 21:11:28.190319');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (4, 'PKG1000012', '2025-09-15 21:11:28.189', 'Tazhara', 1, '', '2025-09-15 21:11:28.190424');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (5, 'PKG1000002', '2025-09-16 20:15:41.605', 'Kayla Richards', 1, 'This customer is so damn pretty', '2025-09-16 20:15:41.605549');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (6, 'PKG1000001', '2025-09-16 20:15:41.606', 'Kayla Richards', 1, 'This customer is so damn pretty', '2025-09-16 20:15:41.607006');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (7, 'PKG1000006', '2025-09-16 21:15:19.535', 'Antonio Ricahrd', 1, '', '2025-09-16 21:15:19.535899');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (9, 'PKG210426', '2025-09-16 21:17:53.537', 'A man', 1, '', '2025-09-16 21:17:53.537888');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (12, 'PKG947169', '2025-09-20 00:09:32.103', 'Kayla', 1, '', '2025-09-20 00:09:32.104116');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (13, 'PKG1000005', '2025-09-20 00:09:45.766', 'Reuel', 1, '', '2025-09-20 00:09:45.766719');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (14, 'PKG597393', '2025-09-20 00:10:03.487', 'Suena', 1, '', '2025-09-20 00:10:03.48726');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (15, 'PKG1000010', '2025-09-20 00:22:22.397', 'Tazhara', 1, '', '2025-09-20 00:22:22.397688');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (16, 'PKG1000009', '2025-09-20 00:22:22.397', 'Tazhara', 1, '', '2025-09-20 00:22:22.397616');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (17, 'PKG406742', '2025-09-20 00:22:22.528', 'Tazhara', 1, '', '2025-09-20 00:22:22.528714');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (18, 'PKG1000014', '2025-09-20 00:35:10.157', 'Her man', 6, '', '2025-09-20 00:35:10.157516');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (19, 'PKG364192', '2025-09-20 00:35:10.158', 'Her man', 6, '', '2025-09-20 00:35:10.15854');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (20, 'PKG572217', '2025-09-20 00:35:10.16', 'Her man', 6, '', '2025-09-20 00:35:10.161155');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (21, 'PKG1000004', '2025-09-20 00:38:00.937', 'Her man', 6, '', '2025-09-20 00:38:00.937123');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (22, 'PKG1000003', '2025-09-20 00:38:00.937', 'Her man', 6, '', '2025-09-20 00:38:00.937199');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (23, 'PKG0018', '2025-09-20 21:33:35.438', 'Reuel Richards', 6, '', '2025-09-20 21:33:35.439174');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (24, 'PKG0001', '2025-09-20 21:54:38.177', 'Her Man', 1, '', '2025-09-20 21:54:38.177675');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (25, 'PKG0019', '2025-09-20 21:54:38.273', 'Her Man', 1, '', '2025-09-20 21:54:38.273318');
INSERT INTO public.deliveries (delivery_id, package_id, delivered_at, received_by, delivered_by, notes, created_at) VALUES (26, 'PKG0008', '2025-09-22 21:18:39.984', 'John Doe', 1, '', '2025-09-22 21:18:39.985131');


--
-- TOC entry 5142 (class 0 OID 41146)
-- Dependencies: 244
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.migrations (id, filename, executed_at) VALUES (1, '001_initial_setup.sql', '2025-09-23 19:43:37.205719');


--
-- TOC entry 5131 (class 0 OID 41014)
-- Dependencies: 233
-- Data for Name: packagenotifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.packagenotifications (notification_id, user_id, admin_id, description, weight, tracking_number, carrier, notes, notification_type, created_at, updated_at) VALUES (1, 4, 1, 'This looks like a red package with stuff on it', 4.40, '123isdi', 'Amazon', 'Come get your package miss', 'missing_prealert', '2025-09-09 00:26:12.215578', '2025-09-09 00:26:12.215578');
INSERT INTO public.packagenotifications (notification_id, user_id, admin_id, description, weight, tracking_number, carrier, notes, notification_type, created_at, updated_at) VALUES (2, 4, 1, 'This package is definitely a package', 2.60, '34245234dsfefd', 'FedEx', 'Note? What are those?????', 'missing_prealert', '2025-09-09 00:33:28.256823', '2025-09-09 00:33:28.256823');
INSERT INTO public.packagenotifications (notification_id, user_id, admin_id, description, weight, tracking_number, carrier, notes, notification_type, created_at, updated_at) VALUES (3, 5, 1, 'Hi bro', 222.00, '333', 'Amazon', 'I love you', 'missing_prealert', '2025-09-09 00:43:36.199023', '2025-09-09 00:43:36.199023');
INSERT INTO public.packagenotifications (notification_id, user_id, admin_id, description, weight, tracking_number, carrier, notes, notification_type, created_at, updated_at) VALUES (4, 4, 1, 'This is a package with illicit materials', 4.00, '128458FSF', 'FedEX', 'This is illegal', 'missing_prealert', '2025-09-20 21:47:54.986755', '2025-09-20 21:47:54.986755');


--
-- TOC entry 5129 (class 0 OID 16899)
-- Dependencies: 231
-- Data for Name: packagepayments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000011', 1, 36.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG074864', 2, 5600.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000015', 3, 43.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000012', 4, 73.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000002', 5, 40.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000001', 6, 50.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000006', 7, 47.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG210426', 9, 6700.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG947169', 12, 5000.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000005', 13, 42.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG597393', 14, 5500.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000010', 15, 4000.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000009', 16, 5000.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG406742', 17, 4672.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000014', 18, 125.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG364192', 19, 7675.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG572217', 20, 8000.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000004', 21, 6500.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG1000003', 22, 7000.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG0018', 23, 4500.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG0001', 24, 6785.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG0019', 25, 7678.00);
INSERT INTO public.packagepayments (package_id, payment_id, amount) VALUES ('PKG0008', 26, 5600.00);


--
-- TOC entry 5117 (class 0 OID 16780)
-- Dependencies: 219
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000008', 3, 'TRK3000003', 2.10, 11.00, 7.00, 4.00, 'Mobile Phones', 75.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-08 20:39:27.359842', 80.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG348121', 2, 'TRK241B3841', 4.00, NULL, NULL, NULL, 'Nike Running Shoes Size 10', 95.00, 'Arrived at Selected Branch', '2025-09-20 00:15:48.121889', '2025-09-20 00:21:08.067472', 5700.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000007', 3, 'TRK3000002', 6.25, 20.00, 14.00, 7.00, 'Fitness Equipment', 55.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-16 20:27:20.791134', 60.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG333613', 2, 'TRK9FBF3395', 4.00, NULL, NULL, NULL, 'Textbooks - Mathematics and Science', 180.00, 'Arrived at Selected Branch', '2025-09-20 00:15:33.614456', '2025-09-20 00:21:15.767944', 6655.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0002', 3, 'TN1234567891', 1.20, 8.00, 4.00, 2.50, 'Clothes', 50.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:22:16.355014', 50000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000006', 3, 'TRK3000001', 4.80, 16.00, 12.00, 6.00, 'Home Decor Items', 42.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-16 21:15:19.535', 47.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0007', 2, 'TN1234567896', 5.50, 25.00, 20.00, 10.00, 'Home Electronics', 350.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:30:44.019395', 4000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG732358', 4, 'TRKA541B3EB', 2.00, NULL, NULL, NULL, 'This is a package test', 24.00, 'Delivered', '2025-09-15 17:18:52.359507', '2025-09-15 17:23:21.014708', 6500.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0005', 3, 'TN1234567894', 0.80, 5.00, 3.00, 2.00, 'Toys', 30.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:52:55.356312', 6000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000010', 3, 'TRK3000005', 1.75, 9.00, 6.00, 3.00, 'Jewelry Items', 85.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:22:22.397', 4000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG210426', 3, 'TRK1E6ED5BD', 5.00, NULL, NULL, NULL, 'Shoes from SHEIN', 57.99, 'Delivered', '2025-09-16 21:13:30.427169', '2025-09-16 21:17:53.537', 6700.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG074864', 4, 'TRK5F0F2C63', 2.00, NULL, NULL, NULL, 'This is the item you requested', 123.34, 'Delivered', '2025-09-09 00:34:34.865676', '2025-09-15 21:11:28.151', 5600.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000011', 4, 'TRK4000001', 3.45, 13.00, 9.00, 5.00, 'Baby Products', 32.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-15 21:11:28.151', 36.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000015', 4, 'TRK4000005', 4.10, 15.00, 10.00, 6.00, 'Gardening Tools', 38.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-15 21:11:28.189', 43.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000012', 4, 'TRK4000002', 9.20, 26.00, 18.00, 10.00, 'Sports Equipment', 68.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-15 21:11:28.189', 73.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000002', 2, 'TRK2000002', 5.75, 18.00, 12.00, 6.00, 'Clothing - Winter Jackets', 35.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-16 20:15:41.605', 40.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000001', 2, 'TRK2000001', 2.50, 12.00, 8.00, 4.00, 'Electronics - Laptop', 45.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-16 20:15:41.606', 50.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000009', 3, 'TRK3000004', 7.90, 22.00, 15.00, 9.00, 'Office Supplies', 48.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:22:22.397', 5000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG406742', 3, 'TRK03F44D34', 5.00, NULL, NULL, NULL, 'This is a sexy item', 69.99, 'Delivered', '2025-09-16 20:43:26.743452', '2025-09-20 00:22:22.528', 4672.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000014', 4, 'TRK4000004', 2.85, 12.00, 8.00, 4.00, 'Camera Equipment', 120.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:35:10.157', 125.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG364192', 4, 'TRKB4C6B974', 2.00, NULL, NULL, NULL, 'Basketball and Tennis Racket', 120.00, 'Delivered', '2025-09-08 23:32:44.193263', '2025-09-20 00:35:10.158', 7675.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG572217', 4, 'TRK2639A384', 45.00, NULL, NULL, NULL, 'This is an item for sure', 27.87, 'Delivered', '2025-09-08 23:36:12.218171', '2025-09-20 00:35:10.16', 8000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0001', 2, 'TN1234567890', 2.50, 10.00, 5.00, 3.00, 'Electronics', 100.00, 'Delivered', '2025-09-20 21:18:38.391174', '2025-09-20 21:54:38.177', 6785.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0008', 3, 'TN1234567897', 1.00, 7.00, 4.50, 3.00, 'Clothing Accessories', 40.00, 'Delivered', '2025-09-20 21:18:38.391174', '2025-09-22 21:18:39.984', 5600.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG947169', 3, 'TRKB9FE057D', 6.00, NULL, NULL, NULL, 'Office Chair and Desk Organizer', 320.00, 'Delivered', '2025-09-16 20:52:27.170592', '2025-09-20 00:09:32.103', 5000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000005', 2, 'TRK2000005', 3.15, 14.00, 10.00, 5.00, 'Shoes and Accessories', 38.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:09:45.766', 42.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG597393', 4, 'TRK88081E78', 34.00, NULL, NULL, NULL, 'Gardening Gloves and Tools Set', 75.00, 'Delivered', '2025-09-08 23:36:37.393846', '2025-09-20 00:10:03.487', 5500.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000013', 4, 'TRK4000003', 5.60, 17.00, 11.00, 6.00, 'Beauty Products', 45.00, 'Arrived in Jamaica', '2025-09-08 20:39:27.359842', '2025-09-20 00:37:26.338624', 4500.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000003', 2, 'TRK2000003', 1.20, 10.00, 6.00, 3.00, 'Books - Educational Materials', 25.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:38:00.937', 7000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG1000004', 2, 'TRK2000004', 8.30, 24.00, 16.00, 8.00, 'Kitchen Appliances', 65.00, 'Delivered', '2025-09-08 20:39:27.359842', '2025-09-20 00:38:00.937', 6500.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0003', 4, 'TN1234567892', 3.80, 15.00, 10.00, 6.00, 'Books and Stationery', 120.00, 'In Transit to Selected Branch', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0004', 2, 'TN1234567893', 4.00, 20.00, 15.00, 8.00, 'Furniture', 250.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0006', 4, 'TN1234567895', 2.00, 12.00, 6.00, 4.50, 'Kitchen Appliances', 90.00, 'Arrived at Selected Branch', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0012', 4, 'TN1234567901', 2.20, 8.00, 5.00, 4.00, 'Beauty Products', 60.00, 'In Transit to Selected Branch', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0016', 2, 'TN1234567905', 2.00, 14.00, 7.00, 4.00, 'Personal Care Products', 65.00, 'Arrived at Selected Branch', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0020', 3, 'TN1234567909', 3.00, 12.00, 8.00, 5.00, 'Gadgets', 75.00, 'Delivered', '2025-09-20 21:18:38.391174', '2025-09-20 21:18:38.391174', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0011', 3, 'TN1234567900', 3.00, 10.00, 6.00, 5.00, 'Office Supplies', 80.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:21:11.583384', 21476.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0017', 3, 'TN1234567906', 5.20, 25.00, 20.00, 9.00, 'Furniture', 250.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:22:35.254909', 5000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0009', 4, 'TN1234567898', 6.30, 18.00, 14.00, 9.00, 'Appliances', 300.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:23:26.987491', 3000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0014', 3, 'TN1234567903', 4.50, 13.00, 8.00, 5.00, 'Books', 110.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:30:25.343936', 3000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0013', 2, 'TN1234567902', 7.40, 18.00, 10.00, 8.00, 'Sports Gear', 220.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:32:42.043158', 40000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0018', 4, 'TN1234567907', 0.50, 4.00, 3.00, 2.00, 'Jewelry', 35.00, 'Delivered', '2025-09-20 21:18:38.391174', '2025-09-20 21:33:35.438', 4500.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0015', 4, 'TN1234567904', 1.75, 9.00, 4.00, 3.50, 'Beauty Gadgets', 55.00, 'Arrived in Jamaica', '2025-09-20 21:18:38.391174', '2025-09-20 21:53:06.57678', 3000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG945222', 4, 'TRKAB543294', 4.00, NULL, NULL, NULL, 'Jewelry Package', 35.00, 'Ready For Pickup', '2025-09-20 21:49:05.223589', '2025-09-20 21:53:38.276261', 7000.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG0019', 2, 'TN1234567908', 1.10, 6.00, 4.00, 3.00, 'Shoes', 45.00, 'Delivered', '2025-09-20 21:18:38.391174', '2025-09-20 21:54:38.273', 7678.00);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG993150', 2, 'TRKE855A017', 5.00, NULL, NULL, NULL, 'This is a package that has a proper receipt', 80.00, 'Delivered to Overseas Warehouse', '2025-09-22 20:46:33.150369', '2025-09-22 20:46:33.150369', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG334490', 4, 'TRK63DC40A9', 6.00, NULL, NULL, NULL, 'Beauty Gadgets', 55.00, 'Delivered to Overseas Warehouse', '2025-09-22 21:08:54.490869', '2025-09-22 21:08:54.490869', NULL);
INSERT INTO public.packages (package_id, user_id, tracking_number, weight, length, width, height, description, cost, status, created_at, updated_at, finalcost) VALUES ('PKG396320', 4, 'TRK4BA63A27', 4.00, NULL, NULL, NULL, 'Appliances', 300.00, 'Delivered to Overseas Warehouse', '2025-09-22 21:09:56.321121', '2025-09-22 21:09:56.321121', NULL);


--
-- TOC entry 5126 (class 0 OID 16868)
-- Dependencies: 228
-- Data for Name: packageshipments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5121 (class 0 OID 16820)
-- Dependencies: 223
-- Data for Name: packagetracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (5, 'PKG074864', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-15 17:11:04.917591');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (6, 'PKG074864', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-15 17:11:59.702519');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (7, 'PKG732358', NULL, 'Processing', NULL, 1, '2025-09-15 17:20:12.476768');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (8, 'PKG732358', NULL, 'Delivered to Overseas Warehouse', NULL, 1, '2025-09-15 17:20:33.523084');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (9, 'PKG732358', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-15 17:21:00.158107');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (10, 'PKG732358', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-15 17:22:33.698898');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (11, 'PKG732358', NULL, 'Arrived at Selected Branch', NULL, 1, '2025-09-15 17:22:49.497516');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (12, 'PKG732358', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 17:23:05.96233');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (13, 'PKG732358', NULL, 'Delivered', NULL, 1, '2025-09-15 17:23:21.015587');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (14, 'PKG1000015', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:54:58.82139');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (15, 'PKG1000006', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:55:07.959474');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (16, 'PKG074864', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:55:20.253091');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (17, 'PKG1000011', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:55:35.23718');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (18, 'PKG1000001', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:55:42.445314');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (19, 'PKG1000002', NULL, 'Ready For Pickup', NULL, 1, '2025-09-15 20:55:50.759952');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (20, 'PKG1000011', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-15 21:11:28.151');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (21, 'PKG074864', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-15 21:11:28.151');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (22, 'PKG1000015', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-15 21:11:28.189');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (23, 'PKG1000012', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-15 21:11:28.189');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (24, 'PKG1000002', NULL, 'Delivered', 'Package delivered to Kayla Richards. This customer is so damn pretty', 1, '2025-09-16 20:15:41.605');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (25, 'PKG1000001', NULL, 'Delivered', 'Package delivered to Kayla Richards. This customer is so damn pretty', 1, '2025-09-16 20:15:41.606');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (26, 'PKG597393', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-16 20:16:12.440007');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (27, 'PKG572217', NULL, 'Delivered to Overseas Warehouse', NULL, 1, '2025-09-16 20:19:46.485395');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (28, 'PKG597393', NULL, 'Ready For Pickup', NULL, 1, '2025-09-16 20:22:22.6761');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (29, 'PKG364192', NULL, 'Delivered to Overseas Warehouse', NULL, 1, '2025-09-16 20:24:40.820258');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (30, 'PKG1000009', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-16 20:25:03.062222');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (31, 'PKG1000007', NULL, 'Delivered', NULL, 1, '2025-09-16 20:27:20.79185');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (32, 'PKG1000010', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-16 20:27:43.62514');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (33, 'PKG210426', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-16 21:14:23.75989');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (34, 'PKG1000006', NULL, 'Delivered', 'Package delivered to Antonio Ricahrd. ', 1, '2025-09-16 21:15:19.535');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (35, 'PKG572217', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-16 21:16:40.049076');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (36, 'PKG210426', NULL, 'Ready For Pickup', NULL, 1, '2025-09-16 21:17:10.64899');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (37, 'PKG947169', NULL, 'Delivered to Overseas Warehouse', NULL, 1, '2025-09-16 21:17:17.305454');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (38, 'PKG947169', NULL, 'Ready For Pickup', NULL, 1, '2025-09-16 21:17:26.865277');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (40, 'PKG210426', NULL, 'Delivered', 'Package delivered to A man. ', 1, '2025-09-16 21:17:53.537');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (43, 'PKG947169', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-19 19:36:37.266664');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (44, 'PKG947169', NULL, 'Ready For Pickup', NULL, 1, '2025-09-19 19:36:47.207347');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (45, 'PKG1000014', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-19 23:18:16.095272');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (46, 'PKG947169', NULL, 'Delivered', 'Package delivered to Kayla. ', 1, '2025-09-20 00:09:32.103');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (47, 'PKG1000005', NULL, 'Delivered', 'Package delivered to Reuel. ', 1, '2025-09-20 00:09:45.766');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (48, 'PKG597393', NULL, 'Delivered', 'Package delivered to Suena. ', 1, '2025-09-20 00:10:03.487');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (49, 'PKG348121', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 00:16:07.626225');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (50, 'PKG333613', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 00:16:18.201254');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (51, 'PKG406742', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 00:16:29.373824');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (52, 'PKG364192', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 00:16:42.335904');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (53, 'PKG1000003', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 00:16:51.070426');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (54, 'PKG348121', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:00.672532');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (55, 'PKG333613', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:12.090059');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (56, 'PKG406742', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:20.61179');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (57, 'PKG364192', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:28.660177');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (58, 'PKG1000003', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:41.499605');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (59, 'PKG1000004', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 00:18:52.410147');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (60, 'PKG348121', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:07.955288');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (61, 'PKG333613', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:13.991759');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (62, 'PKG406742', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:21.483595');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (63, 'PKG572217', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:26.923655');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (64, 'PKG364192', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:32.353678');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (65, 'PKG1000003', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:37.937173');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (66, 'PKG1000004', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:44.459022');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (67, 'PKG1000009', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:51.668343');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (68, 'PKG1000010', NULL, 'In Transit to Selected Branch', NULL, 1, '2025-09-20 00:19:55.773786');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (69, 'PKG348121', NULL, 'Arrived at Selected Branch', NULL, 1, '2025-09-20 00:21:08.068295');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (70, 'PKG333613', NULL, 'Arrived at Selected Branch', NULL, 1, '2025-09-20 00:21:15.768512');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (71, 'PKG406742', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:21.142483');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (72, 'PKG572217', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:27.112511');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (73, 'PKG364192', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:33.17467');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (74, 'PKG1000014', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:39.034919');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (75, 'PKG1000003', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:43.60571');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (76, 'PKG1000004', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:21:48.554235');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (77, 'PKG1000010', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:22:02.252044');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (78, 'PKG1000009', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 00:22:10.803625');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (79, 'PKG1000010', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-20 00:22:22.397');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (80, 'PKG1000009', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-20 00:22:22.397');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (81, 'PKG406742', NULL, 'Delivered', 'Package delivered to Tazhara. ', 1, '2025-09-20 00:22:22.528');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (82, 'PKG1000014', NULL, 'Delivered', 'Package delivered to Her man. ', 6, '2025-09-20 00:35:10.157');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (83, 'PKG364192', NULL, 'Delivered', 'Package delivered to Her man. ', 6, '2025-09-20 00:35:10.158');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (84, 'PKG572217', NULL, 'Delivered', 'Package delivered to Her man. ', 6, '2025-09-20 00:35:10.16');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (85, 'PKG1000013', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 00:37:26.339075');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (86, 'PKG1000004', NULL, 'Delivered', 'Package delivered to Her man. ', 6, '2025-09-20 00:38:00.937');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (87, 'PKG1000003', NULL, 'Delivered', 'Package delivered to Her man. ', 6, '2025-09-20 00:38:00.937');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (88, 'PKG0008', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:20:02.737314');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (89, 'PKG0018', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:20:21.617613');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (90, 'PKG0001', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:20:48.133639');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (91, 'PKG0019', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:20:56.79974');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (92, 'PKG0011', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:21:11.583792');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (93, 'PKG0002', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:22:16.355402');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (94, 'PKG0017', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:22:35.255379');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (95, 'PKG0009', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:23:26.987884');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (96, 'PKG0014', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:30:25.344373');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (97, 'PKG0007', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:30:44.019768');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (98, 'PKG0013', NULL, 'Ready For Pickup', NULL, 6, '2025-09-20 21:31:41.702775');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (99, 'PKG0013', NULL, 'Arrived in Jamaica', NULL, 6, '2025-09-20 21:32:42.043579');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (100, 'PKG0018', NULL, 'Ready For Pickup', NULL, 6, '2025-09-20 21:33:08.522363');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (101, 'PKG0018', NULL, 'Delivered', 'Package delivered to Reuel Richards. ', 6, '2025-09-20 21:33:35.438');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (102, 'PKG945222', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 21:49:39.696995');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (103, 'PKG0015', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 21:49:45.71529');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (104, 'PKG0005', NULL, 'In Transit to Jamaica', NULL, 1, '2025-09-20 21:49:50.869599');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (105, 'PKG945222', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 21:52:45.579192');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (106, 'PKG0005', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 21:52:55.356722');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (107, 'PKG0015', NULL, 'Arrived in Jamaica', NULL, 1, '2025-09-20 21:53:06.577277');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (108, 'PKG945222', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 21:53:38.277051');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (109, 'PKG0008', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 21:53:44.072393');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (110, 'PKG0001', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 21:53:52.378294');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (111, 'PKG0019', NULL, 'Ready For Pickup', NULL, 1, '2025-09-20 21:53:57.709339');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (112, 'PKG0001', NULL, 'Delivered', 'Package delivered to Her Man. ', 1, '2025-09-20 21:54:38.177');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (113, 'PKG0019', NULL, 'Delivered', 'Package delivered to Her Man. ', 1, '2025-09-20 21:54:38.273');
INSERT INTO public.packagetracking (tracking_id, package_id, location, status, notes, created_by, created_at) VALUES (114, 'PKG0008', NULL, 'Delivered', 'Package delivered to John Doe. ', 1, '2025-09-22 21:18:39.984');


--
-- TOC entry 5128 (class 0 OID 16884)
-- Dependencies: 230
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (1, 4, 36.00, 'cash', 'completed', 'DEL-PKG1000011-1757988688155', '2025-09-15 21:11:28.151');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (2, 4, 5600.00, 'cash', 'completed', 'DEL-PKG074864-1757988688156', '2025-09-15 21:11:28.151');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (3, 4, 43.00, 'cash', 'completed', 'DEL-PKG1000015-1757988688193', '2025-09-15 21:11:28.189');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (4, 4, 73.00, 'cash', 'completed', 'DEL-PKG1000012-1757988688193', '2025-09-15 21:11:28.189');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (5, 2, 40.00, 'cash', 'completed', 'DEL-PKG1000002-1758071741608', '2025-09-16 20:15:41.605');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (6, 2, 50.00, 'cash', 'completed', 'DEL-PKG1000001-1758071741610', '2025-09-16 20:15:41.606');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (7, 3, 47.00, 'cash', 'completed', 'DEL-PKG1000006-1758075319539', '2025-09-16 21:15:19.535');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (9, 3, 6700.00, 'cash', 'completed', 'DEL-PKG210426-1758075473541', '2025-09-16 21:17:53.537');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (12, 3, 5000.00, 'cash', 'completed', 'DEL-PKG947169-1758344972109', '2025-09-20 00:09:32.103');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (13, 2, 42.00, 'cash', 'completed', 'DEL-PKG1000005-1758344985770', '2025-09-20 00:09:45.766');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (14, 4, 5500.00, 'cash', 'completed', 'DEL-PKG597393-1758345003490', '2025-09-20 00:10:03.487');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (15, 3, 4000.00, 'cash', 'completed', 'DEL-PKG1000010-1758345742398', '2025-09-20 00:22:22.397');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (16, 3, 5000.00, 'cash', 'completed', 'DEL-PKG1000009-1758345742399', '2025-09-20 00:22:22.397');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (17, 3, 4672.00, 'cash', 'completed', 'DEL-PKG406742-1758345742531', '2025-09-20 00:22:22.528');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (18, 4, 125.00, 'cash', 'completed', 'DEL-PKG1000014-1758346510160', '2025-09-20 00:35:10.157');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (19, 4, 7675.00, 'cash', 'completed', 'DEL-PKG364192-1758346510161', '2025-09-20 00:35:10.158');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (20, 4, 8000.00, 'cash', 'completed', 'DEL-PKG572217-1758346510186', '2025-09-20 00:35:10.16');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (21, 2, 6500.00, 'cash', 'completed', 'DEL-PKG1000004-1758346680939', '2025-09-20 00:38:00.937');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (22, 2, 7000.00, 'cash', 'completed', 'DEL-PKG1000003-1758346680939', '2025-09-20 00:38:00.937');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (23, 4, 4500.00, 'cash', 'completed', 'DEL-PKG0018-1758422015443', '2025-09-20 21:33:35.438');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (24, 2, 6785.00, 'cash', 'completed', 'DEL-PKG0001-1758423278181', '2025-09-20 21:54:38.177');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (25, 2, 7678.00, 'cash', 'completed', 'DEL-PKG0019-1758423278276', '2025-09-20 21:54:38.273');
INSERT INTO public.payments (payment_id, user_id, amount, payment_method, status, transaction_id, created_at) VALUES (26, 3, 5600.00, 'cash', 'completed', 'DEL-PKG0008-1758593919991', '2025-09-22 21:18:39.984');


--
-- TOC entry 5119 (class 0 OID 16801)
-- Dependencies: 221
-- Data for Name: prealerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (1, 2, 'PKG1000001', 'Dell XPS 15 Laptop', 1200.00, 'https://storage.com/invoices/inv200001.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (2, 2, 'PKG1000002', 'North Face Winter Jackets (2 pcs)', 350.00, 'https://storage.com/invoices/inv200002.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (4, 2, 'PKG1000004', 'KitchenAid Mixer and Blender', 450.00, 'https://storage.com/invoices/inv200004.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (6, 3, 'PKG1000006', 'Home Wall Decor and Paintings', 220.00, 'https://storage.com/invoices/inv300001.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (7, 3, 'PKG1000007', 'Yoga Mat and Weights Set', 150.00, 'https://storage.com/invoices/inv300002.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (8, 3, 'PKG1000008', 'iPhone 14 Pro Max (2 units)', 2200.00, 'https://storage.com/invoices/inv300003.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (10, 3, 'PKG1000010', 'Gold Necklace and Earrings Set', 850.00, 'https://storage.com/invoices/inv300005.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (11, 4, 'PKG1000011', 'Baby Stroller and Car Seat', 380.00, 'https://storage.com/invoices/inv400001.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (13, 4, 'PKG1000013', 'Skincare Products Collection', 280.00, 'https://storage.com/invoices/inv400003.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (14, 4, 'PKG1000014', 'Canon EOS Camera and Lenses', 1500.00, 'https://storage.com/invoices/inv400004.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 20:40:13.223773', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (12, 4, 'PKG364192', 'Basketball and Tennis Racket', 120.00, 'https://storage.com/invoices/inv400002.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 23:32:44.194834', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (16, 4, 'PKG572217', 'This is an item for sure', 27.87, 'blob:http://localhost:5173/1c9bc125-e694-4bed-853b-52b35a160a88', 'C', '2025-09-08 23:35:40.607593', '2025-09-08 23:36:12.219186', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (15, 4, 'PKG597393', 'Gardening Gloves and Tools Set', 75.00, 'https://storage.com/invoices/inv400005.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-08 23:36:37.394828', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (17, 4, 'PKG074864', 'This is the item you requested', 123.34, 'blob:http://localhost:5173/d56fb391-ab8a-4eb2-897e-523ad1ef5b03', 'C', '2025-09-09 00:34:12.2702', '2025-09-09 00:34:34.866788', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (18, 4, 'PKG732358', 'This is a package test', 24.00, NULL, 'C', '2025-09-15 17:18:32.657708', '2025-09-15 17:18:52.361035', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (19, 3, 'PKG406742', 'This is a sexy item', 69.99, NULL, 'C', '2025-09-16 20:42:31.475872', '2025-09-16 20:43:26.744372', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (9, 3, 'PKG947169', 'Office Chair and Desk Organizer', 320.00, 'https://storage.com/invoices/inv300004.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-16 20:52:27.171606', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (20, 3, 'PKG210426', 'Shoes from SHEIN', 57.99, NULL, 'C', '2025-09-16 21:07:22.94186', '2025-09-16 21:13:30.428035', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (3, 2, 'PKG333613', 'Textbooks - Mathematics and Science', 180.00, 'https://storage.com/invoices/inv200003.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-20 00:15:33.616453', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (5, 2, 'PKG348121', 'Nike Running Shoes Size 10', 95.00, 'https://storage.com/invoices/inv200005.pdf', 'C', '2025-09-08 20:40:13.223773', '2025-09-20 00:15:48.122706', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (21, 2, 'PKG0001', 'Electronics Package', 100.00, 'https://cloudstorage.com/invoice123', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (22, 3, 'PKG0002', 'Clothing Package', 50.00, 'https://cloudstorage.com/invoice124', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (23, 4, 'PKG0003', 'Books and Stationery', 120.00, 'https://cloudstorage.com/invoice125', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (24, 2, 'PKG0004', 'Furniture Package', 250.00, 'https://cloudstorage.com/invoice126', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (25, 3, 'PKG0005', 'Toys Package', 30.00, 'https://cloudstorage.com/invoice127', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (26, 4, 'PKG0006', 'Kitchen Appliances', 90.00, 'https://cloudstorage.com/invoice128', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (27, 2, 'PKG0007', 'Home Electronics', 350.00, 'https://cloudstorage.com/invoice129', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (28, 3, 'PKG0008', 'Clothing Accessories', 40.00, 'https://cloudstorage.com/invoice130', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (30, 2, 'PKG0010', 'Fitness Equipment', 150.00, 'https://cloudstorage.com/invoice132', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (31, 3, 'PKG0011', 'Office Supplies', 80.00, 'https://cloudstorage.com/invoice133', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (32, 4, 'PKG0012', 'Beauty Products', 60.00, 'https://cloudstorage.com/invoice134', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (33, 2, 'PKG0013', 'Sports Gear', 220.00, 'https://cloudstorage.com/invoice135', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (34, 3, 'PKG0014', 'Books Package', 110.00, 'https://cloudstorage.com/invoice136', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (36, 2, 'PKG0016', 'Personal Care Products', 65.00, 'https://cloudstorage.com/invoice138', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (37, 3, 'PKG0017', 'Furniture Package', 250.00, 'https://cloudstorage.com/invoice139', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (39, 2, 'PKG0019', 'Shoes Package', 45.00, 'https://cloudstorage.com/invoice141', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (40, 3, 'PKG0020', 'Gadgets Package', 75.00, 'https://cloudstorage.com/invoice142', 'U', '2025-09-20 21:18:46.117517', '2025-09-20 21:18:46.117517', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (38, 4, 'PKG945222', 'Jewelry Package', 35.00, 'https://cloudstorage.com/invoice140', 'C', '2025-09-20 21:18:46.117517', '2025-09-20 21:49:05.225164', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (41, 2, NULL, 'Paw patrol toys', 25.00, NULL, 'U', '2025-09-20 21:44:02.792829', '2025-09-22 18:42:06.750708', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (42, 2, NULL, 'This is a prealert', 284.00, 'blob:http://localhost:5173/068dc542-d053-4d8e-b989-dabe91ddfefd', 'U', '2025-09-22 19:11:56.931311', '2025-09-22 19:11:56.931311', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (43, 2, 'PKG993150', 'This is a package that has a proper receipt', 70.00, 'https://pongs-shipping-company.s3.us-east-2.amazonaws.com/receipts/61d45117-d6db-41f9-897a-e567f32e4947.pdf', 'C', '2025-09-22 20:45:15.894679', '2025-09-22 20:46:33.153031', 'receipts/61d45117-d6db-41f9-897a-e567f32e4947.pdf');
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (35, 4, 'PKG334490', 'Beauty Gadgets', 55.00, 'https://cloudstorage.com/invoice137', 'C', '2025-09-20 21:18:46.117517', '2025-09-22 21:08:54.492447', NULL);
INSERT INTO public.prealerts (prealert_id, user_id, package_id, description, price, invoice_url, status, created_at, updated_at, s3_key) VALUES (29, 4, 'PKG396320', 'Appliances', 300.00, 'https://cloudstorage.com/invoice131', 'C', '2025-09-20 21:18:46.117517', '2025-09-22 21:09:56.322691', NULL);


--
-- TOC entry 5125 (class 0 OID 16860)
-- Dependencies: 227
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5140 (class 0 OID 41123)
-- Dependencies: 242
-- Data for Name: staff_actions_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (1, 5, 'staff_created', 'user', '6', 'Created new admin staff member: Liam Davids', 0.00, '{"role": "A", "email": "ldavids@test.com", "branch": "Ocho Rios"}', '2025-09-19 23:48:21.110803');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (2, 1, 'prealert_confirmation', 'prealert', '3', 'Confirmed prealert and created package TRK9FBF3395', 180.00, '{"cost": 180, "packageId": "PKG333613", "prealertId": "3", "trackingNumber": "TRK9FBF3395"}', '2025-09-20 00:15:37.005289');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (3, 1, 'prealert_confirmation', 'prealert', '5', 'Confirmed prealert and created package TRK241B3841', 95.00, '{"cost": 95, "packageId": "PKG348121", "prealertId": "5", "trackingNumber": "TRK241B3841"}', '2025-09-20 00:15:51.356959');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (4, 1, 'package_status_update', 'package', 'PKG348121', 'Updated package TRK241B3841 status to In Transit to Jamaica', 95.00, '{"status": "In Transit to Jamaica", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:16:09.525038');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (5, 1, 'package_status_update', 'package', 'PKG333613', 'Updated package TRK9FBF3395 status to In Transit to Jamaica', 180.00, '{"status": "In Transit to Jamaica", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:16:18.202037');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (6, 1, 'package_status_update', 'package', 'PKG406742', 'Updated package TRK03F44D34 status to In Transit to Jamaica', 69.99, '{"status": "In Transit to Jamaica", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:16:32.517972');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (7, 1, 'package_status_update', 'package', 'PKG364192', 'Updated package TRKB4C6B974 status to In Transit to Jamaica', 120.00, '{"status": "In Transit to Jamaica", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:16:45.136512');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (8, 1, 'package_status_update', 'package', 'PKG1000003', 'Updated package TRK2000003 status to In Transit to Jamaica', 28.00, '{"status": "In Transit to Jamaica", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:16:51.071229');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (9, 1, 'transfer_creation', 'transfer', '3', 'Created transfer list to jamaica with 7 packages', 0.00, '{"notes": "", "packages": ["PKG348121", "PKG333613", "PKG406742", "PKG364192", "PKG1000003", "PKG1000004", "PKG1000014"], "destination": "jamaica", "packageCount": 7}', '2025-09-20 00:17:13.756401');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (10, 1, 'package_status_update', 'package', 'PKG348121', 'Updated package TRK241B3841 status to Arrived in Jamaica', 5700.00, '{"status": "Arrived in Jamaica", "finalCost": 5700, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:04.168871');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (11, 1, 'package_status_update', 'package', 'PKG333613', 'Updated package TRK9FBF3395 status to Arrived in Jamaica', 6655.00, '{"status": "Arrived in Jamaica", "finalCost": 6655, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:12.090841');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (12, 1, 'package_status_update', 'package', 'PKG406742', 'Updated package TRK03F44D34 status to Arrived in Jamaica', 4672.00, '{"status": "Arrived in Jamaica", "finalCost": 4672, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:20.612665');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (13, 1, 'package_status_update', 'package', 'PKG364192', 'Updated package TRKB4C6B974 status to Arrived in Jamaica', 7675.00, '{"status": "Arrived in Jamaica", "finalCost": 7675, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:30.608387');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (14, 1, 'package_status_update', 'package', 'PKG1000003', 'Updated package TRK2000003 status to Arrived in Jamaica', 7000.00, '{"status": "Arrived in Jamaica", "finalCost": 7000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:41.500475');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (15, 1, 'package_status_update', 'package', 'PKG1000004', 'Updated package TRK2000004 status to Arrived in Jamaica', 6500.00, '{"status": "Arrived in Jamaica", "finalCost": 6500, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 00:18:55.100886');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (16, 1, 'package_status_update', 'package', 'PKG348121', 'Updated package TRK241B3841 status to In Transit to Selected Branch', 5700.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:07.956637');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (17, 1, 'package_status_update', 'package', 'PKG333613', 'Updated package TRK9FBF3395 status to In Transit to Selected Branch', 6655.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:13.992691');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (18, 1, 'package_status_update', 'package', 'PKG406742', 'Updated package TRK03F44D34 status to In Transit to Selected Branch', 4672.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:21.484417');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (19, 1, 'package_status_update', 'package', 'PKG572217', 'Updated package TRK2639A384 status to In Transit to Selected Branch', 8000.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:26.924407');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (20, 1, 'package_status_update', 'package', 'PKG364192', 'Updated package TRKB4C6B974 status to In Transit to Selected Branch', 7675.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:32.3545');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (21, 1, 'package_status_update', 'package', 'PKG1000003', 'Updated package TRK2000003 status to In Transit to Selected Branch', 7000.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:37.938124');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (22, 1, 'package_status_update', 'package', 'PKG1000004', 'Updated package TRK2000004 status to In Transit to Selected Branch', 6500.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:44.459839');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (23, 1, 'package_status_update', 'package', 'PKG1000009', 'Updated package TRK3000004 status to In Transit to Selected Branch', 5000.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:51.669263');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (24, 1, 'package_status_update', 'package', 'PKG1000010', 'Updated package TRK3000005 status to In Transit to Selected Branch', 4000.00, '{"status": "In Transit to Selected Branch", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 00:19:55.774614');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (25, 1, 'transfer_creation', 'transfer', '4', 'Created transfer list to priory-branch with 10 packages', 0.00, '{"notes": "", "packages": ["PKG348121", "PKG333613", "PKG406742", "PKG572217", "PKG364192", "PKG1000014", "PKG1000003", "PKG1000004", "PKG1000009", "PKG1000010"], "destination": "priory-branch", "packageCount": 10}', '2025-09-20 00:20:12.73567');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (26, 1, 'package_status_update', 'package', 'PKG348121', 'Updated package TRK241B3841 status to Arrived at Selected Branch', 5700.00, '{"status": "Arrived at Selected Branch", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:08.069735');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (27, 1, 'package_status_update', 'package', 'PKG333613', 'Updated package TRK9FBF3395 status to Arrived at Selected Branch', 6655.00, '{"status": "Arrived at Selected Branch", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:15.769319');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (28, 1, 'package_status_update', 'package', 'PKG406742', 'Updated package TRK03F44D34 status to Ready For Pickup', 4672.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:21.143373');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (29, 1, 'package_status_update', 'package', 'PKG572217', 'Updated package TRK2639A384 status to Ready For Pickup', 8000.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:27.113328');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (30, 1, 'package_status_update', 'package', 'PKG364192', 'Updated package TRKB4C6B974 status to Ready For Pickup', 7675.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:33.175482');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (31, 1, 'package_status_update', 'package', 'PKG1000014', 'Updated package TRK4000004 status to Ready For Pickup', 125.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:39.035806');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (32, 1, 'package_status_update', 'package', 'PKG1000003', 'Updated package TRK2000003 status to Ready For Pickup', 7000.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:43.606531');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (33, 1, 'package_status_update', 'package', 'PKG1000004', 'Updated package TRK2000004 status to Ready For Pickup', 6500.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:21:52.251808');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (34, 1, 'package_status_update', 'package', 'PKG1000010', 'Updated package TRK3000005 status to Ready For Pickup', 4000.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:22:02.253033');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (35, 1, 'package_status_update', 'package', 'PKG1000009', 'Updated package TRK3000004 status to Ready For Pickup', 5000.00, '{"status": "Ready For Pickup", "previousStatus": "In Transit to Selected Branch"}', '2025-09-20 00:22:10.80438');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (36, 6, 'package_status_update', 'package', 'PKG1000013', 'Updated package TRK4000003 status to Arrived in Jamaica', 4500.00, '{"status": "Arrived in Jamaica", "finalCost": 4500, "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 00:37:26.340715');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (37, 6, 'package_status_update', 'package', 'PKG0008', 'Updated package TN1234567897 status to Arrived in Jamaica', 5600.00, '{"status": "Arrived in Jamaica", "finalCost": 5600, "previousStatus": "Ready For Pickup"}', '2025-09-20 21:20:02.739041');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (38, 6, 'package_status_update', 'package', 'PKG0018', 'Updated package TN1234567907 status to Arrived in Jamaica', 4500.00, '{"status": "Arrived in Jamaica", "finalCost": 4500, "previousStatus": "Ready For Pickup"}', '2025-09-20 21:20:21.618911');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (39, 6, 'package_status_update', 'package', 'PKG0001', 'Updated package TN1234567890 status to Arrived in Jamaica', 6785.00, '{"status": "Arrived in Jamaica", "finalCost": 6785, "previousStatus": "Processing"}', '2025-09-20 21:20:48.134928');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (40, 6, 'package_status_update', 'package', 'PKG0019', 'Updated package TN1234567908 status to Arrived in Jamaica', 7678.00, '{"status": "Arrived in Jamaica", "finalCost": 7678, "previousStatus": "Processing"}', '2025-09-20 21:20:56.800558');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (41, 6, 'package_status_update', 'package', 'PKG0011', 'Updated package TN1234567900 status to Arrived in Jamaica', 21476.00, '{"status": "Arrived in Jamaica", "finalCost": 21476, "previousStatus": "Processing"}', '2025-09-20 21:21:11.585108');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (42, 6, 'package_status_update', 'package', 'PKG0002', 'Updated package TN1234567891 status to Arrived in Jamaica', 50000.00, '{"status": "Arrived in Jamaica", "finalCost": 50000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:22:16.35696');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (43, 6, 'package_status_update', 'package', 'PKG0017', 'Updated package TN1234567906 status to Arrived in Jamaica', 5000.00, '{"status": "Arrived in Jamaica", "finalCost": 5000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:22:35.25688');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (44, 6, 'package_status_update', 'package', 'PKG0009', 'Updated package TN1234567898 status to Arrived in Jamaica', 3000.00, '{"status": "Arrived in Jamaica", "finalCost": 3000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:23:26.989062');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (45, 6, 'package_status_update', 'package', 'PKG0014', 'Updated package TN1234567903 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 3000, "packageCost": 3000, "previousStatus": "Out for Delivery"}', '2025-09-20 21:30:25.345914');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (46, 6, 'package_status_update', 'package', 'PKG0007', 'Updated package TN1234567896 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 4000, "packageCost": 4000, "previousStatus": "Out for Delivery"}', '2025-09-20 21:30:44.021146');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (47, 6, 'package_status_update', 'package', 'PKG0013', 'Updated package TN1234567902 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "220.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:31:41.704345');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (48, 6, 'package_status_update', 'package', 'PKG0013', 'Updated package TN1234567902 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 40000, "packageCost": 40000, "previousStatus": "Ready For Pickup"}', '2025-09-20 21:32:42.04479');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (49, 6, 'package_status_update', 'package', 'PKG0018', 'Updated package TN1234567907 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "4500.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:33:08.523731');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (50, 6, 'package_delivery', 'package', 'PKG0018', 'Delivered package TN1234567907 to Reuel Richards', 4500.00, '{"notes": "", "customer_id": 4, "received_by": "Reuel Richards", "customer_name": "Tazhara Richards", "payment_method": "cash", "tracking_number": "TN1234567907"}', '2025-09-20 21:33:35.445737');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (51, 1, 'customer_notification', 'customer', '4', 'Sent package notification to Tazhara Richards for tracking 128458FSF', 0.00, '{"carrier": "FedEX", "description": "This is a package with illicit materials", "customer_name": "Tazhara Richards", "customer_email": "reuelrichards4@gmail.com", "tracking_number": "128458FSF", "notification_type": "missing_prealert"}', '2025-09-20 21:47:54.991098');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (52, 1, 'prealert_confirmation', 'prealert', '38', 'Confirmed prealert and created package TRKAB543294', 0.00, '{"cost": 35, "packageId": "PKG945222", "prealertId": "38", "trackingNumber": "TRKAB543294"}', '2025-09-20 21:49:07.903413');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (53, 1, 'package_status_update', 'package', 'PKG945222', 'Updated package TRKAB543294 status to In Transit to Jamaica', 0.00, '{"status": "In Transit to Jamaica", "packageCost": "35.00", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 21:49:39.698732');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (54, 1, 'package_status_update', 'package', 'PKG0015', 'Updated package TN1234567904 status to In Transit to Jamaica', 0.00, '{"status": "In Transit to Jamaica", "packageCost": "55.00", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 21:49:45.71629');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (55, 1, 'package_status_update', 'package', 'PKG0005', 'Updated package TN1234567894 status to In Transit to Jamaica', 0.00, '{"status": "In Transit to Jamaica", "packageCost": "30.00", "previousStatus": "Delivered to Overseas Warehouse"}', '2025-09-20 21:49:50.870447');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (56, 1, 'transfer_creation', 'transfer', '5', 'Created transfer list to jamaica with 3 packages', 0.00, '{"notes": "THis has illegal substances", "packages": ["PKG945222", "PKG0005", "PKG0015"], "destination": "jamaica", "packageCount": 3}', '2025-09-20 21:50:40.561265');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (57, 1, 'package_status_update', 'package', 'PKG945222', 'Updated package TRKAB543294 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 7000, "packageCost": 7000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:52:45.580868');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (58, 1, 'package_status_update', 'package', 'PKG0005', 'Updated package TN1234567894 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 6000, "packageCost": 6000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:52:55.357639');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (59, 1, 'package_status_update', 'package', 'PKG0015', 'Updated package TN1234567904 status to Arrived in Jamaica', 0.00, '{"status": "Arrived in Jamaica", "finalCost": 3000, "packageCost": 3000, "previousStatus": "In Transit to Jamaica"}', '2025-09-20 21:53:06.579255');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (60, 1, 'package_status_update', 'package', 'PKG945222', 'Updated package TRKAB543294 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "7000.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:53:38.278599');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (61, 1, 'package_status_update', 'package', 'PKG0008', 'Updated package TN1234567897 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "5600.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:53:44.073363');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (62, 1, 'package_status_update', 'package', 'PKG0001', 'Updated package TN1234567890 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "6785.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:53:52.379104');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (63, 1, 'package_status_update', 'package', 'PKG0019', 'Updated package TN1234567908 status to Ready For Pickup', 0.00, '{"status": "Ready For Pickup", "packageCost": "7678.00", "previousStatus": "Arrived in Jamaica"}', '2025-09-20 21:53:57.710331');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (64, 1, 'package_delivery', 'package', 'PKG0001', 'Delivered package TN1234567890 to Her Man', 6785.00, '{"notes": "", "customer_id": 2, "received_by": "Her Man", "customer_name": "Kayla Richards", "payment_method": "cash", "tracking_number": "TN1234567890"}', '2025-09-20 21:54:38.206158');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (65, 1, 'package_delivery', 'package', 'PKG0019', 'Delivered package TN1234567908 to Her Man', 7678.00, '{"notes": "", "customer_id": 2, "received_by": "Her Man", "customer_name": "Kayla Richards", "payment_method": "cash", "tracking_number": "TN1234567908"}', '2025-09-20 21:54:38.278865');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (66, 1, 'prealert_confirmation', 'prealert', '43', 'Confirmed prealert and created package TRKE855A017', 0.00, '{"cost": 80, "packageId": "PKG993150", "prealertId": "43", "trackingNumber": "TRKE855A017"}', '2025-09-22 20:46:36.074697');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (67, 1, 'prealert_confirmation', 'prealert', '35', 'Confirmed prealert and created package TRK63DC40A9', 0.00, '{"cost": 55, "packageId": "PKG334490", "prealertId": "35", "trackingNumber": "TRK63DC40A9"}', '2025-09-22 21:08:56.608706');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (68, 1, 'prealert_confirmation', 'prealert', '29', 'Confirmed prealert and created package TRK4BA63A27', 0.00, '{"cost": 300, "packageId": "PKG396320", "prealertId": "29", "trackingNumber": "TRK4BA63A27"}', '2025-09-22 21:09:57.971287');
INSERT INTO public.staff_actions_log (log_id, staff_id, action_type, entity_type, entity_id, description, revenue_impact, metadata, created_at) VALUES (69, 1, 'package_delivery', 'package', 'PKG0008', 'Delivered package TN1234567897 to John Doe', 5600.00, '{"notes": "", "customer_id": 3, "received_by": "John Doe", "customer_name": "Antonio Richards", "payment_method": "cash", "tracking_number": "TN1234567897"}', '2025-09-22 21:18:40.020112');


--
-- TOC entry 5136 (class 0 OID 41082)
-- Dependencies: 238
-- Data for Name: staff_performance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (1, 5, '2025-09-20', 0, 0, 1, 0.00, 0, 0, '2025-09-19 23:48:21.112973', '2025-09-19 23:48:21.112973');
INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (51, 1, '2025-09-21', 13, 1, 0, 14463.00, 1, 4, '2025-09-20 21:47:54.992305', '2025-09-20 21:54:38.279251');
INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (66, 1, '2025-09-23', 4, 0, 0, 5600.00, 3, 4, '2025-09-22 20:46:36.078543', '2025-09-22 21:18:40.022562');
INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (2, 1, '2025-09-20', 32, 2, 0, 149498.99, 2, 9, '2025-09-20 00:15:37.00674', '2025-09-20 00:22:10.80469');
INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (36, 6, '2025-09-20', 1, 0, 0, 4500.00, 0, 0, '2025-09-20 00:37:26.342213', '2025-09-20 00:37:26.342213');
INSERT INTO public.staff_performance (performance_id, staff_id, date, packages_processed, transfers_created, customers_added, revenue_generated, prealerts_confirmed, notifications_sent, created_at, updated_at) VALUES (37, 6, '2025-09-21', 14, 0, 0, 108539.00, 0, 1, '2025-09-20 21:20:02.740097', '2025-09-20 21:33:35.446845');


--
-- TOC entry 5134 (class 0 OID 41056)
-- Dependencies: 236
-- Data for Name: transfer_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (2, 'PKG1000004', true, '2025-09-19 23:25:31.555895');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG1000004', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG348121', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG333613', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG406742', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG364192', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG1000003', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (3, 'PKG1000014', true, '2025-09-20 00:17:13.728558');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG1000009', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG1000010', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG348121', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG1000014', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG333613', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG406742', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG572217', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG364192', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG1000003', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (4, 'PKG1000004', true, '2025-09-20 00:20:12.704616');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (5, 'PKG0005', true, '2025-09-20 21:50:40.532317');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (5, 'PKG945222', true, '2025-09-20 21:50:40.532317');
INSERT INTO public.transfer_packages (transfer_id, package_id, checked_off, added_at) VALUES (5, 'PKG0015', true, '2025-09-20 21:50:40.532317');


--
-- TOC entry 5133 (class 0 OID 41038)
-- Dependencies: 235
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.transfers (transfer_id, destination, status, notes, created_by, created_at, updated_at) VALUES (2, 'jamaica', 'delivered', NULL, 1, '2025-09-19 23:25:31.555895', '2025-09-19 23:26:10.321353');
INSERT INTO public.transfers (transfer_id, destination, status, notes, created_by, created_at, updated_at) VALUES (3, 'jamaica', 'delivered', NULL, 1, '2025-09-20 00:17:13.728558', '2025-09-20 00:17:40.096084');
INSERT INTO public.transfers (transfer_id, destination, status, notes, created_by, created_at, updated_at) VALUES (4, 'priory-branch', 'delivered', NULL, 1, '2025-09-20 00:20:12.704616', '2025-09-20 00:20:52.006608');
INSERT INTO public.transfers (transfer_id, destination, status, notes, created_by, created_at, updated_at) VALUES (5, 'jamaica', 'delivered', 'THis has illegal substances', 1, '2025-09-20 21:50:40.532317', '2025-09-20 21:51:56.449233');


--
-- TOC entry 5116 (class 0 OID 16646)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (3, 'Antonio', 'Richards', 'reuelrichards3@gmail.com', '$2b$12$EGrzM5v1wDROoahqKpoeseuRDhdyISEIB9So8ZlggMQM.Fe6NDpu.', '', '3132 NW 43rd Street, PSC Priory 03', 'Priory', 'C', '2025-09-08 20:33:42.447051', '2025-09-08 20:33:42.447051', true, NULL, NULL, NULL, NULL);
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (4, 'Tazhara', 'Richards', 'reuelrichards4@gmail.com', '$2b$12$hu47EiPGxpFr0ziKLIa4t.zgCccvkgcRZi6IusVB.zpPyHohR3q5y', '', '3132 NW 43rd Street, PSC Priory 04', 'Priory', 'C', '2025-09-08 20:36:00.646929', '2025-09-08 20:36:08.120315', true, NULL, NULL, NULL, NULL);
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (1, 'Reuel', 'Richards', 'reuelrichards@gmail.com', '$2b$12$5B1Pumq0aPhgkh8qOVra1ur0B2dusuNhj4xUF5Xho/JWBPClV5kci', '8765738748', '3132 NW 43rd Street, PSC Priory 01', 'Ocho Rios', 'A', '2025-09-08 20:31:58.498481', '2025-09-16 20:14:29.005191', true, NULL, NULL, NULL, NULL);
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (5, 'Reuel', 'Richards', 'reuelrichards1@gmail.com', '$2b$12$xxz0csapt8C2aPrNSR0xWu.sBBPfv59RLsvlTmHW91Z6dh.0YSVHS', '8765738748', '3132 NW 43rd Street, PSC Priory 05', 'Priory', 'S', '2025-09-09 00:35:31.892709', '2025-09-09 00:36:15.435153', true, NULL, NULL, NULL, NULL);
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (6, 'Liam', 'Davids', 'ldavids@test.com', '$2b$10$a5EYRWvZOqAxeCFGwPtkceAve1BhUQNtlOsou02aG5SaVkk0szx8u', '', '', 'Ocho Rios', 'A', '2025-09-19 23:48:21.108714', '2025-09-19 23:48:21.108714', true, NULL, NULL, NULL, NULL);
INSERT INTO public.users (user_id, first_name, last_name, email, password_hash, phone, address, branch, role, created_at, updated_at, is_verified, verification_token, verification_token_expires, reset_password_token, reset_password_expires) VALUES (2, 'Kayla', 'Richards', 'reuelrichards2@gmail.com', '$2b$12$4EKckeB0rpW6Dpccy71TV.fHmBy2Wb1lK49Gge8yn8urUlDwXR76W', '', '3132 NW 43rd Street, PSC Priory 02', 'Priory', 'C', '2025-09-08 20:32:42.809421', '2025-09-22 19:10:45.479442', true, NULL, NULL, NULL, NULL);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 239
-- Name: daily_sales_summary_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_sales_summary_summary_id_seq', 1, false);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 224
-- Name: deliveries_delivery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deliveries_delivery_id_seq', 26, true);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 243
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 232
-- Name: packagenotifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packagenotifications_notification_id_seq', 4, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 222
-- Name: packagetracking_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packagetracking_tracking_id_seq', 114, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 229
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 26, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 220
-- Name: prealerts_prealert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prealerts_prealert_id_seq', 43, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 226
-- Name: shipments_shipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipments_shipment_id_seq', 1, false);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 241
-- Name: staff_actions_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_actions_log_log_id_seq', 69, true);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 237
-- Name: staff_performance_performance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_performance_performance_id_seq', 69, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 234
-- Name: transfers_transfer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transfers_transfer_id_seq', 5, true);


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 6, true);


--
-- TOC entry 4933 (class 2606 OID 41121)
-- Name: daily_sales_summary daily_sales_summary_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sales_summary
    ADD CONSTRAINT daily_sales_summary_date_key UNIQUE (date);


--
-- TOC entry 4935 (class 2606 OID 41119)
-- Name: daily_sales_summary daily_sales_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sales_summary
    ADD CONSTRAINT daily_sales_summary_pkey PRIMARY KEY (summary_id);


--
-- TOC entry 4903 (class 2606 OID 16848)
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (delivery_id);


--
-- TOC entry 4943 (class 2606 OID 41154)
-- Name: migrations migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_filename_key UNIQUE (filename);


--
-- TOC entry 4945 (class 2606 OID 41152)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 41024)
-- Name: packagenotifications packagenotifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagenotifications
    ADD CONSTRAINT packagenotifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 4912 (class 2606 OID 16904)
-- Name: packagepayments packagepayments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagepayments
    ADD CONSTRAINT packagepayments_pkey PRIMARY KEY (package_id, payment_id);


--
-- TOC entry 4891 (class 2606 OID 16792)
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (package_id);


--
-- TOC entry 4893 (class 2606 OID 16794)
-- Name: packages packages_tracking_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_tracking_number_key UNIQUE (tracking_number);


--
-- TOC entry 4908 (class 2606 OID 16872)
-- Name: packageshipments packageshipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packageshipments
    ADD CONSTRAINT packageshipments_pkey PRIMARY KEY (package_id, shipment_id);


--
-- TOC entry 4901 (class 2606 OID 16828)
-- Name: packagetracking packagetracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagetracking
    ADD CONSTRAINT packagetracking_pkey PRIMARY KEY (tracking_id);


--
-- TOC entry 4910 (class 2606 OID 16893)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 4897 (class 2606 OID 16813)
-- Name: prealerts prealerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prealerts
    ADD CONSTRAINT prealerts_pkey PRIMARY KEY (prealert_id);


--
-- TOC entry 4906 (class 2606 OID 16867)
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (shipment_id);


--
-- TOC entry 4941 (class 2606 OID 41132)
-- Name: staff_actions_log staff_actions_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_actions_log
    ADD CONSTRAINT staff_actions_log_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4929 (class 2606 OID 41096)
-- Name: staff_performance staff_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_performance
    ADD CONSTRAINT staff_performance_pkey PRIMARY KEY (performance_id);


--
-- TOC entry 4931 (class 2606 OID 41098)
-- Name: staff_performance staff_performance_staff_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_performance
    ADD CONSTRAINT staff_performance_staff_id_date_key UNIQUE (staff_id, date);


--
-- TOC entry 4925 (class 2606 OID 41062)
-- Name: transfer_packages transfer_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfer_packages
    ADD CONSTRAINT transfer_packages_pkey PRIMARY KEY (transfer_id, package_id);


--
-- TOC entry 4921 (class 2606 OID 41050)
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (transfer_id);


--
-- TOC entry 4885 (class 2606 OID 16660)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4887 (class 2606 OID 16658)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4936 (class 1259 OID 41140)
-- Name: idx_daily_sales_summary_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_sales_summary_date ON public.daily_sales_summary USING btree (date);


--
-- TOC entry 4904 (class 1259 OID 16921)
-- Name: idx_deliveries_package_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliveries_package_id ON public.deliveries USING btree (package_id);


--
-- TOC entry 4913 (class 1259 OID 41036)
-- Name: idx_package_notifications_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_notifications_admin_id ON public.packagenotifications USING btree (admin_id);


--
-- TOC entry 4914 (class 1259 OID 41035)
-- Name: idx_package_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_notifications_user_id ON public.packagenotifications USING btree (user_id);


--
-- TOC entry 4888 (class 1259 OID 16917)
-- Name: idx_packages_tracking_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_packages_tracking_number ON public.packages USING btree (tracking_number);


--
-- TOC entry 4889 (class 1259 OID 16916)
-- Name: idx_packages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_packages_user_id ON public.packages USING btree (user_id);


--
-- TOC entry 4894 (class 1259 OID 41144)
-- Name: idx_prealerts_s3_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prealerts_s3_key ON public.prealerts USING btree (s3_key);


--
-- TOC entry 4895 (class 1259 OID 16918)
-- Name: idx_prealerts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prealerts_user_id ON public.prealerts USING btree (user_id);


--
-- TOC entry 4937 (class 1259 OID 41142)
-- Name: idx_staff_actions_log_action_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_actions_log_action_type ON public.staff_actions_log USING btree (action_type);


--
-- TOC entry 4938 (class 1259 OID 41143)
-- Name: idx_staff_actions_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_actions_log_created_at ON public.staff_actions_log USING btree (created_at);


--
-- TOC entry 4939 (class 1259 OID 41141)
-- Name: idx_staff_actions_log_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_actions_log_staff_id ON public.staff_actions_log USING btree (staff_id);


--
-- TOC entry 4926 (class 1259 OID 41139)
-- Name: idx_staff_performance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_performance_date ON public.staff_performance USING btree (date);


--
-- TOC entry 4927 (class 1259 OID 41138)
-- Name: idx_staff_performance_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_performance_staff_id ON public.staff_performance USING btree (staff_id);


--
-- TOC entry 4898 (class 1259 OID 16920)
-- Name: idx_tracking_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tracking_created_at ON public.packagetracking USING btree (created_at);


--
-- TOC entry 4899 (class 1259 OID 16919)
-- Name: idx_tracking_package_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tracking_package_id ON public.packagetracking USING btree (package_id);


--
-- TOC entry 4922 (class 1259 OID 41077)
-- Name: idx_transfer_packages_package_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfer_packages_package_id ON public.transfer_packages USING btree (package_id);


--
-- TOC entry 4923 (class 1259 OID 41076)
-- Name: idx_transfer_packages_transfer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfer_packages_transfer_id ON public.transfer_packages USING btree (transfer_id);


--
-- TOC entry 4917 (class 1259 OID 41075)
-- Name: idx_transfers_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_created_by ON public.transfers USING btree (created_by);


--
-- TOC entry 4918 (class 1259 OID 41073)
-- Name: idx_transfers_destination; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_destination ON public.transfers USING btree (destination);


--
-- TOC entry 4919 (class 1259 OID 41074)
-- Name: idx_transfers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_status ON public.transfers USING btree (status);


--
-- TOC entry 4883 (class 1259 OID 16915)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4969 (class 2620 OID 41161)
-- Name: daily_sales_summary update_daily_sales_summary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_daily_sales_summary_updated_at BEFORE UPDATE ON public.daily_sales_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4965 (class 2620 OID 41157)
-- Name: packages update_packages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4966 (class 2620 OID 41158)
-- Name: prealerts update_prealerts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_prealerts_updated_at BEFORE UPDATE ON public.prealerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4968 (class 2620 OID 41160)
-- Name: staff_performance update_staff_performance_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_performance_updated_at BEFORE UPDATE ON public.staff_performance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4967 (class 2620 OID 41159)
-- Name: transfers update_transfers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4964 (class 2620 OID 41156)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4950 (class 2606 OID 16854)
-- Name: deliveries deliveries_delivered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_delivered_by_fkey FOREIGN KEY (delivered_by) REFERENCES public.users(user_id);


--
-- TOC entry 4951 (class 2606 OID 16849)
-- Name: deliveries deliveries_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 41030)
-- Name: packagenotifications packagenotifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagenotifications
    ADD CONSTRAINT packagenotifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 41025)
-- Name: packagenotifications packagenotifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagenotifications
    ADD CONSTRAINT packagenotifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 16905)
-- Name: packagepayments packagepayments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagepayments
    ADD CONSTRAINT packagepayments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id) ON DELETE CASCADE;


--
-- TOC entry 4956 (class 2606 OID 16910)
-- Name: packagepayments packagepayments_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagepayments
    ADD CONSTRAINT packagepayments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id) ON DELETE CASCADE;


--
-- TOC entry 4946 (class 2606 OID 16795)
-- Name: packages packages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 16873)
-- Name: packageshipments packageshipments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packageshipments
    ADD CONSTRAINT packageshipments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id) ON DELETE CASCADE;


--
-- TOC entry 4953 (class 2606 OID 16878)
-- Name: packageshipments packageshipments_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packageshipments
    ADD CONSTRAINT packageshipments_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(shipment_id) ON DELETE CASCADE;


--
-- TOC entry 4948 (class 2606 OID 16834)
-- Name: packagetracking packagetracking_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagetracking
    ADD CONSTRAINT packagetracking_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 4949 (class 2606 OID 16829)
-- Name: packagetracking packagetracking_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packagetracking
    ADD CONSTRAINT packagetracking_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id) ON DELETE CASCADE;


--
-- TOC entry 4954 (class 2606 OID 16894)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4947 (class 2606 OID 16814)
-- Name: prealerts prealerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prealerts
    ADD CONSTRAINT prealerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 41133)
-- Name: staff_actions_log staff_actions_log_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_actions_log
    ADD CONSTRAINT staff_actions_log_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 41099)
-- Name: staff_performance staff_performance_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_performance
    ADD CONSTRAINT staff_performance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 41068)
-- Name: transfer_packages transfer_packages_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfer_packages
    ADD CONSTRAINT transfer_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 41063)
-- Name: transfer_packages transfer_packages_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfer_packages
    ADD CONSTRAINT transfer_packages_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(transfer_id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 41051)
-- Name: transfers transfers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE RESTRICT;


-- Completed on 2025-09-23 22:12:57

--
-- PostgreSQL database dump complete
--

