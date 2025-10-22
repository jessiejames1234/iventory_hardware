-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 13, 2025 at 12:19 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test_db_hardware5`
--

-- --------------------------------------------------------

--
-- Table structure for table `brand`
--

CREATE TABLE `brand` (
  `brand_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brand`
--

INSERT INTO `brand` (`brand_id`, `name`) VALUES
(3, 'Intel'),
(4, 'NVIDIA'),
(5, 'Test');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `name`) VALUES
(4, 'Processor'),
(5, 'Graphics Card'),
(6, 'Test');

-- --------------------------------------------------------

--
-- Table structure for table `goods_received_items`
--

CREATE TABLE `goods_received_items` (
  `grn_item_id` int(11) NOT NULL,
  `grn_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `received_qty` int(11) NOT NULL,
  `unit_cost` decimal(18,2) NOT NULL,
  `line_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `goods_received_items`
--

INSERT INTO `goods_received_items` (`grn_item_id`, `grn_id`, `product_id`, `received_qty`, `unit_cost`, `line_note`) VALUES
(44, 19, 45, 5, 5800.00, '5 guba'),
(45, 19, 42, 5, 8500.00, NULL),
(46, 19, 43, 5, 9500.00, NULL),
(47, 19, 48, 5, 2800.00, NULL),
(48, 20, 45, 5, 5800.00, NULL),
(49, 21, 45, 5, 5800.00, NULL),
(50, 22, 45, 5, 5800.00, NULL),
(55, 23, 48, 3, 2800.00, NULL),
(58, 24, 48, 2, 2800.00, NULL),
(59, 29, 42, 2, 8500.00, NULL),
(60, 33, 48, 1, 2800.00, NULL),
(61, 33, 49, 1, 4500.00, NULL),
(62, 34, 45, 1, 5800.00, NULL),
(82, 35, 45, 2, 5800.00, NULL),
(83, 35, 43, 2, 9500.00, NULL),
(84, 35, 43, 2, 9500.00, NULL),
(85, 35, 48, 2, 2800.00, NULL),
(87, 38, 45, 1, 5800.00, NULL),
(88, 38, 42, 1, 8500.00, NULL),
(89, 43, 48, 1, 2800.00, NULL),
(90, 47, 45, 1, 5800.00, NULL),
(91, 47, 42, 1, 8500.00, NULL),
(92, 54, 45, 1, 5800.00, NULL),
(93, 58, 45, 1, 5800.00, NULL),
(94, 59, 42, 1, 8500.00, NULL),
(99, 60, 45, 2, 5800.00, NULL),
(100, 60, 43, 2, 9500.00, NULL),
(101, 60, 48, 2, 2800.00, NULL),
(104, 61, 45, 2, 5800.00, NULL),
(105, 61, 42, 2, 8500.00, NULL),
(108, 62, 45, 2, 5800.00, NULL),
(109, 62, 42, 1, 8500.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `goods_received_notes`
--

CREATE TABLE `goods_received_notes` (
  `grn_id` int(11) NOT NULL,
  `po_id` int(11) DEFAULT NULL,
  `purchase_return_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `received_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `received_by` int(11) NOT NULL,
  `status` enum('draft','confirmed') NOT NULL DEFAULT 'draft',
  `reference_no` varchar(30) DEFAULT NULL,
  `remarks` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `goods_received_notes`
--

INSERT INTO `goods_received_notes` (`grn_id`, `po_id`, `purchase_return_id`, `supplier_id`, `location_id`, `received_date`, `received_by`, `status`, `reference_no`, `remarks`) VALUES
(19, 105, NULL, 4, 7, '2025-09-21 11:59:37', 27, 'confirmed', 'GRN-0019', ''),
(20, 105, NULL, 4, 7, '2025-09-21 12:01:22', 27, 'confirmed', 'GRN-0020', NULL),
(21, 106, NULL, 4, 7, '2025-09-21 12:01:57', 27, 'confirmed', 'GRN-0021', NULL),
(22, 106, NULL, 4, 7, '2025-09-21 12:03:14', 27, 'confirmed', 'GRN-0022', NULL),
(23, 106, NULL, 4, 7, '2025-09-25 05:31:26', 27, 'confirmed', 'GRN-0023', ''),
(24, 106, NULL, 4, 7, '2025-09-25 06:11:56', 31, 'confirmed', 'GRN-0024', ''),
(29, 108, NULL, 4, 7, '2025-09-27 01:19:23', 27, 'confirmed', 'GRN-0029', NULL),
(33, 110, NULL, 4, 7, '2025-09-27 01:36:46', 27, 'confirmed', 'GRN-0033', NULL),
(34, 113, NULL, 4, 7, '2025-09-27 04:22:34', 27, 'confirmed', 'GRN-0034', NULL),
(35, 115, NULL, 4, 7, '2025-10-02 09:41:19', 27, 'confirmed', 'GRN-0035', ''),
(38, 114, NULL, 4, 7, '2025-10-02 23:43:39', 27, 'confirmed', 'GRN-0038', ''),
(43, 111, NULL, 4, 7, '2025-10-02 23:45:13', 27, 'confirmed', 'GRN-0043', NULL),
(47, 113, NULL, 4, 7, '2025-10-02 23:46:27', 27, 'confirmed', 'GRN-0047', NULL),
(54, 116, NULL, 4, 7, '2025-10-02 23:51:04', 27, 'confirmed', 'GRN-0054', NULL),
(58, 116, NULL, 4, 7, '2025-10-03 00:04:40', 27, 'confirmed', 'GRN-0058', NULL),
(59, 113, NULL, 4, 7, '2025-10-03 00:04:48', 27, 'draft', NULL, NULL),
(60, 116, NULL, 4, 7, '2025-10-03 00:05:14', 27, 'confirmed', 'GRN-0060', ''),
(61, 120, NULL, 4, 7, '2025-10-03 00:33:19', 27, 'confirmed', 'GRN-0061', ''),
(62, 120, NULL, 4, 7, '2025-10-03 00:33:39', 27, 'confirmed', 'GRN-0062', '');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `product_id`, `location_id`, `quantity`) VALUES
(65, 45, 7, 5),
(66, 42, 7, 10),
(67, 43, 7, 7),
(68, 48, 7, 14),
(69, 42, 1, 0),
(70, 48, 1, 0),
(71, 49, 7, 1),
(72, 45, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `location`
--

CREATE TABLE `location` (
  `location_id` int(11) NOT NULL,
  `location_name` varchar(100) NOT NULL,
  `address` varchar(50) NOT NULL,
  `type` enum('store','warehouse') NOT NULL DEFAULT 'warehouse',
  `is_active` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `location`
--

INSERT INTO `location` (`location_id`, `location_name`, `address`, `type`, `is_active`) VALUES
(1, 'store', '', 'store', 1),
(2, 'das', '', '', 1),
(3, 'dsa', '', '', 1),
(4, 'warehouse1', '', '', 1),
(5, 'warehouse2', '', '', 1),
(6, 'Warehouse ni Karel', 'Carmen lang', 'warehouse', 1),
(7, 'Warehouse ni Paul', 'Carmen lang', 'warehouse', 1),
(8, 'sda', '', '', 1),
(9, 'ss', '', '', 1),
(10, 's', 's', 'warehouse', 1);

-- --------------------------------------------------------

--
-- Table structure for table `pos_terminal`
--

CREATE TABLE `pos_terminal` (
  `terminal_id` int(11) NOT NULL,
  `terminal_name` varchar(100) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pos_terminal`
--

INSERT INTO `pos_terminal` (`terminal_id`, `terminal_name`, `status`) VALUES
(1, '2', 1),
(2, 'dsda', 1),
(3, 'jj', 1),
(4, 'terminal1', 1),
(5, 'terminal2', 1),
(6, 'terminal3', 1),
(7, 'david terminal', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `product_name` varchar(50) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `model` varchar(100) NOT NULL,
  `specs` text NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `reorder_level` int(11) NOT NULL,
  `warranty_period` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `category_id`, `brand_id`, `unit_id`, `product_name`, `sku`, `model`, `specs`, `cost_price`, `selling_price`, `reorder_level`, `warranty_period`, `is_active`, `created_by`, `created_at`, `updated_at`, `updated_by`) VALUES
(1, 4, 3, 1, 'Intel Core i3 Processor', '', 'i3-10100F', '4 Cores, 8 Threads, 3.6GHz', 5200.00, 6000.00, 5, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(2, 4, 3, 1, 'Intel Core i5 Processor', '', 'i5-10400F', '6 Cores, 12 Threads, 2.9GHz', 9500.00, 10500.00, 5, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(3, 4, 3, 1, 'Intel Core i7 Processor', '', 'i7-10700K', '8 Cores, 16 Threads, 3.8GHz', 16500.00, 17800.00, 5, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(4, 4, 3, 1, 'Intel Core i9 Processor', '', 'i9-11900K', '8 Cores, 16 Threads, 3.5GHz', 24500.00, 26000.00, 3, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(5, 4, 3, 1, 'Intel Core i9 Extreme', '', 'i9-13900K', '24 Cores, 32 Threads, 3.0GHz', 32500.00, 35000.00, 2, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(6, 5, 4, 1, 'NVIDIA GeForce GTX 1650', '', 'GTX1650-OC', '4GB GDDR5, Dual Fan', 7800.00, 8800.00, 4, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(7, 5, 4, 1, 'NVIDIA GeForce GTX 1660 Super', '', 'GTX1660S', '6GB GDDR6, Dual Fan', 11800.00, 13000.00, 4, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(8, 5, 4, 1, 'NVIDIA GeForce RTX 2060', '', 'RTX2060', '6GB GDDR6, Ray Tracing', 17500.00, 19000.00, 4, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(9, 5, 4, 1, 'NVIDIA GeForce RTX 3060', '', 'RTX3060', '12GB GDDR6, Ray Tracing', 25500.00, 27000.00, 4, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(10, 5, 4, 1, 'NVIDIA GeForce RTX 3070', '', 'RTX3070', '8GB GDDR6, Ray Tracing', 35000.00, 38000.00, 2, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(11, 5, 4, 1, 'NVIDIA GeForce RTX 3080', '', 'RTX3080', '10GB GDDR6X, Ray Tracing', 58000.00, 62000.00, 2, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(12, 5, 4, 1, 'NVIDIA GeForce RTX 3090', '', 'RTX3090', '24GB GDDR6X, Ray Tracing', 95000.00, 100000.00, 2, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(13, 4, 3, 1, 'DDR4 RAM 8GB', '', 'Corsair-Vengeance-8GB', 'DDR4 3200MHz', 1500.00, 1800.00, 10, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(14, 4, 3, 1, 'DDR4 RAM 16GB', '', 'Corsair-Vengeance-16GB', 'DDR4 3200MHz', 2800.00, 3200.00, 8, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(15, 4, 3, 1, 'DDR4 RAM 32GB', '', 'Corsair-Vengeance-32GB', 'DDR4 3600MHz', 5800.00, 6500.00, 6, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(16, 4, 3, 1, 'SSD 256GB', '', 'Samsung-256GB-SSD', 'NVMe M.2, 3500MB/s', 2200.00, 2600.00, 10, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(17, 4, 3, 1, 'SSD 512GB', '', 'Samsung-512GB-SSD', 'NVMe M.2, 3500MB/s', 3500.00, 4000.00, 8, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(18, 4, 3, 1, 'SSD 1TB', '', 'Samsung-1TB-SSD', 'NVMe M.2, 3500MB/s', 5800.00, 6400.00, 6, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(19, 4, 3, 1, 'HDD 1TB', '', 'Seagate-1TB', '7200RPM, 64MB Cache', 2200.00, 2600.00, 10, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(20, 4, 3, 1, 'HDD 2TB', '', 'Seagate-2TB', '7200RPM, 128MB Cache', 3500.00, 4000.00, 8, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(21, 4, 3, 1, 'Monitor 24 inch', '', 'Acer-24FHD', '1080p, 75Hz, IPS', 6500.00, 7200.00, 4, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(22, 4, 3, 1, 'Monitor 27 inch', '', 'Acer-27FHD', '1080p, 144Hz, IPS', 9500.00, 10500.00, 4, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(23, 4, 3, 1, 'Monitor 32 inch', '', 'LG-32QHD', '1440p, 144Hz, IPS', 14500.00, 15800.00, 2, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(24, 4, 3, 1, 'Motherboard ATX', '', 'ASUS-B560', 'Supports 10th/11th Gen Intel, DDR4', 7500.00, 8200.00, 5, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(25, 4, 3, 1, 'Motherboard Micro-ATX', '', 'MSI-B450M', 'Supports AMD Ryzen, DDR4', 5500.00, 6200.00, 5, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(26, 4, 3, 1, 'Power Supply 500W', '', 'Corsair-500W', '80 Plus Bronze, Modular', 2800.00, 3200.00, 8, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(27, 4, 3, 1, 'Power Supply 650W', '', 'Corsair-650W', '80 Plus Gold, Modular', 4500.00, 5000.00, 6, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(28, 4, 3, 1, 'Power Supply 750W', '', 'Corsair-750W', '80 Plus Gold, Fully Modular', 5800.00, 6400.00, 4, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(29, 4, 3, 1, 'PC Case Mid Tower', '', 'NZXT-H510', 'ATX, Tempered Glass', 3800.00, 4200.00, 6, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(30, 4, 3, 1, 'PC Case Full Tower', '', 'NZXT-H710', 'E-ATX, Tempered Glass', 6500.00, 7200.00, 4, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(31, 4, 3, 1, 'Mechanical Keyboard', '', 'Logitech-G413', 'Mechanical Red Switches, RGB', 2500.00, 2800.00, 10, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(32, 4, 3, 1, 'Gaming Keyboard', '', 'Razer-Blackwidow', 'Mechanical Green Switches, RGB', 4800.00, 5200.00, 8, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(33, 4, 3, 1, 'Gaming Mouse', '', 'Logitech-G502', 'Wired, 16000 DPI', 2800.00, 3200.00, 10, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(34, 4, 3, 1, 'Wireless Mouse', '', 'Razer-Basilisk', 'Wireless, RGB, 26000 DPI', 4200.00, 4800.00, 8, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(35, 4, 3, 1, 'Gaming Headset', '', 'HyperX-CloudII', '7.1 Surround, USB', 3500.00, 4000.00, 6, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(36, 4, 3, 1, 'Wireless Headset', '', 'SteelSeries-Arctis7', 'Wireless, 7.1 Surround', 6500.00, 7200.00, 4, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(37, 4, 3, 1, 'Acer Aspire 5 Laptop', '', 'A515-56', 'Intel i5, 8GB RAM, 512GB SSD, 15.6\"', 28500.00, 32000.00, 3, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(38, 4, 3, 1, 'ASUS VivoBook Laptop', '', 'X415JA', 'Intel i3, 4GB RAM, 256GB SSD, 14\"', 22500.00, 25000.00, 3, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(39, 4, 3, 1, 'Lenovo IdeaPad 3 Laptop', '', '15ADA6', 'AMD Ryzen 5, 8GB RAM, 512GB SSD, 15.6\"', 32500.00, 35000.00, 3, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(40, 4, 3, 1, 'MSI Gaming Laptop', '', 'GF63-Thin', 'Intel i7, RTX 3050, 16GB RAM, 512GB SSD, 15.6\"', 48500.00, 52000.00, 2, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(41, 4, 3, 1, 'Dell XPS 13 Laptop', '', 'XPS-13', 'Intel i7, 16GB RAM, 1TB SSD, 13.3\"', 78500.00, 82000.00, 2, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(42, 4, 3, 1, 'Canon Printer', '', 'Canon-G3010', 'InkTank, Wireless, Print/Scan/Copy', 8500.00, 9200.00, 5, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(43, 4, 3, 1, 'Epson Printer', '', 'Epson-L3150', 'InkTank, Wireless, Print/Scan/Copy', 9500.00, 10200.00, 5, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(44, 4, 3, 1, 'TP-Link Router', '', 'Archer-C6', 'Gigabit, Dual Band', 2800.00, 3200.00, 8, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(45, 4, 3, 1, 'ASUS Router', '', 'RT-AX55', 'WiFi 6, Dual Band', 5800.00, 6400.00, 6, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(46, 4, 3, 1, 'Logitech Webcam', '', 'C920', '1080p, USB', 3500.00, 4000.00, 8, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(47, 4, 3, 1, 'Razer Webcam', '', 'Kiyo', '1080p, Built-in Ring Light', 4800.00, 5200.00, 6, '1 Year', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(48, 4, 3, 1, 'External HDD 1TB', '', 'Seagate-Exp-1TB', 'USB 3.0 Portable HDD', 2800.00, 3200.00, 10, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(49, 4, 3, 1, 'External HDD 2TB', '', 'Seagate-Exp-2TB', 'USB 3.0 Portable HDD', 4500.00, 5000.00, 8, '2 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(50, 4, 3, 1, 'External SSD 1TB', '', 'Samsung-T5-1TB', 'USB-C Portable SSD', 6500.00, 7200.00, 6, '3 Years', 1, 29, '2025-09-03 14:24:19', NULL, NULL),
(51, 4, 3, 2, 'ASUS Laptop Set', '', 'X415EA-Set', 'Intel i5, 8GB RAM, 512GB SSD + Free Bag', 34500.00, 38000.00, 3, '2 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(52, 4, 3, 2, 'Acer Laptop Set', '', 'Aspire5-Set', 'Intel i3, 4GB RAM, 256GB SSD + Free Mouse', 28500.00, 31000.00, 3, '2 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(53, 4, 3, 2, 'Lenovo Laptop Set', '', 'IdeaPad3-Set', 'AMD Ryzen 5, 8GB RAM, 512GB SSD + Free Bag', 38500.00, 42000.00, 3, '2 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(54, 4, 3, 2, 'MSI Gaming Laptop Set', '', 'GF63-Thin-Set', 'Intel i7, RTX 3050, 16GB RAM, 512GB SSD + Headset', 51500.00, 55000.00, 2, '2 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(55, 5, 4, 2, 'RTX 3060 + 650W PSU Bundle', '', 'RTX3060-PSU', '12GB GDDR6 GPU + 80Plus Gold PSU', 29500.00, 33000.00, 3, '3 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(56, 5, 4, 2, 'RTX 3070 + 750W PSU Bundle', '', 'RTX3070-PSU', '8GB GDDR6 GPU + 80Plus Gold PSU', 39000.00, 43000.00, 2, '3 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(57, 4, 3, 2, 'Logitech Keyboard + Mouse Set', '', 'MK270', 'Wireless Combo', 2200.00, 2500.00, 10, '1 Year', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(58, 4, 3, 2, 'Razer Keyboard + Mouse Set', '', 'Cynosa-Bundle', 'RGB Keyboard + Mouse', 4500.00, 5000.00, 6, '1 Year', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(59, 4, 3, 2, 'Corsair RAM Set 16GB (2x8GB)', '', 'Vengeance-16GB-Kit', 'DDR4 3200MHz', 5200.00, 5800.00, 6, '2 Years', 1, 29, '2025-09-03 14:27:54', NULL, NULL),
(60, 4, 3, 2, 'Corsair RAM Set 32GB (2x16GB)', '', 'Vengeance-32GB-Kit', 'DDR4 3600MHz', 10500.00, 11500.00, 4, '2 Years', 0, 29, '2025-09-03 14:27:54', NULL, NULL),
(61, 5, 3, NULL, 'Corsair RAM 2Set 32GB (2x16GB)', '', 'DDDD', 'asd', 2.00, 2.00, 2, 'asd', 1, 9, '2025-09-04 15:26:57', '2025-09-13 00:39:06', 9),
(62, 5, 3, 1, 'TRY', '', 'TRY', 'TRY', 2.00, 2.00, 2, 'TRY', 0, 9, '2025-09-13 00:39:19', NULL, NULL),
(63, 5, 3, NULL, 'Test1', 'TES-GRA-INT-063', 'Test1', 'Test1', 1.00, 1.00, 1, 'Test1', 0, 9, '2025-09-21 12:51:24', NULL, NULL),
(64, 5, 3, NULL, 'Test2', 'Tes-Gra-Int-064', 'Test2', 'Test2', 1.00, 1.00, 2, 'Test2', 1, 9, '2025-09-22 13:16:52', '2025-10-11 04:58:25', 9);

-- --------------------------------------------------------

--
-- Table structure for table `product_supplier`
--

CREATE TABLE `product_supplier` (
  `product_supplier_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_supplier`
--

INSERT INTO `product_supplier` (`product_supplier_id`, `product_id`, `supplier_id`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1),
(6, 6, 1),
(7, 7, 1),
(8, 8, 1),
(9, 9, 1),
(10, 10, 1),
(11, 11, 1),
(12, 12, 1),
(13, 13, 1),
(14, 14, 1),
(15, 15, 1),
(16, 16, 3),
(17, 17, 3),
(18, 18, 3),
(19, 19, 3),
(20, 20, 3),
(21, 21, 3),
(22, 22, 3),
(23, 23, 3),
(24, 24, 3),
(25, 25, 3),
(26, 26, 3),
(27, 27, 3),
(28, 28, 3),
(29, 29, 3),
(30, 30, 3),
(31, 31, 3),
(32, 32, 3),
(33, 33, 3),
(34, 34, 3),
(35, 35, 3),
(36, 36, 3),
(37, 37, 2),
(38, 38, 2),
(39, 39, 2),
(40, 40, 2),
(41, 41, 2),
(42, 46, 2),
(43, 47, 2),
(44, 42, 4),
(45, 43, 4),
(46, 44, 4),
(47, 45, 4),
(48, 48, 4),
(49, 49, 4),
(50, 50, 4),
(51, 8, 5),
(52, 9, 5),
(53, 10, 5),
(54, 40, 5),
(55, 41, 5),
(56, 32, 5),
(57, 33, 5),
(58, 34, 5),
(59, 35, 5),
(60, 36, 5),
(61, 61, 8);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order`
--

CREATE TABLE `purchase_order` (
  `po_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `date_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','partially_received','received','cancelled') NOT NULL DEFAULT 'pending',
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_order`
--

INSERT INTO `purchase_order` (`po_id`, `supplier_id`, `location_id`, `po_number`, `date_created`, `status`, `created_by`) VALUES
(105, 4, 7, 'PO-0105', '2025-09-21 11:58:38', 'received', 27),
(106, 4, 7, 'PO-0106', '2025-09-21 12:01:44', 'received', 27),
(107, 4, 7, 'PO-0107', '2025-09-21 15:11:04', 'approved', 27),
(108, 4, 7, 'PO-0108', '2025-09-23 14:11:08', 'partially_received', 27),
(109, 4, 7, 'PO-0109', '2025-09-25 04:03:52', 'approved', 27),
(110, 4, 7, 'PO-0110', '2025-09-25 05:30:52', 'received', 27),
(111, 4, 7, 'PO-0111', '2025-09-25 06:21:58', 'partially_received', 31),
(112, 4, 7, 'PO-0112', '2025-09-26 14:19:45', 'cancelled', 27),
(113, 4, 7, 'PO-0113', '2025-09-27 01:37:29', 'partially_received', 27),
(114, 4, 7, 'PO-0114', '2025-09-27 03:55:26', 'received', 27),
(115, 4, 7, 'PO-0115', '2025-10-02 09:40:42', 'partially_received', 27),
(116, 4, 7, 'PO-0116', '2025-10-02 23:46:53', 'partially_received', 27),
(117, 4, 7, 'PO-0117', '2025-10-03 00:06:00', 'approved', 27),
(118, 2, 7, 'PO-0118', '2025-10-03 00:16:50', 'approved', 27),
(119, 4, 7, 'PO-0119', '2025-10-03 00:25:58', 'approved', 27),
(120, 4, 7, 'PO-0120', '2025-10-03 00:32:53', 'received', 27);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `po_item_id` int(11) NOT NULL,
  `po_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `ordered_qty` int(11) NOT NULL,
  `received_qty` int(11) NOT NULL DEFAULT 0,
  `unit_cost` decimal(18,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`po_item_id`, `po_id`, `product_id`, `ordered_qty`, `received_qty`, `unit_cost`) VALUES
(98, 105, 45, 10, 10, 5800.00),
(99, 105, 42, 5, 5, 8500.00),
(100, 105, 43, 5, 5, 9500.00),
(101, 105, 48, 5, 5, 2800.00),
(104, 106, 45, 10, 10, 5800.00),
(105, 106, 48, 5, 5, 2800.00),
(115, 110, 48, 1, 1, 2800.00),
(116, 110, 49, 1, 1, 4500.00),
(125, 109, 45, 2, 0, 5800.00),
(126, 109, 43, 1, 0, 9500.00),
(127, 108, 42, 2, 2, 8500.00),
(128, 108, 48, 1, 0, 2800.00),
(129, 107, 45, 5, 0, 5800.00),
(130, 107, 48, 1, 0, 2800.00),
(144, 112, 42, 1, 0, 8500.00),
(145, 112, 43, 3, 0, 9500.00),
(146, 111, 48, 1, 1, 2800.00),
(147, 111, 43, 1, 0, 9500.00),
(150, 113, 45, 2, 2, 5800.00),
(151, 113, 42, 2, 1, 8500.00),
(154, 114, 45, 1, 1, 5800.00),
(155, 114, 42, 1, 1, 8500.00),
(158, 115, 45, 2, 2, 5800.00),
(159, 115, 43, 4, 4, 9500.00),
(160, 115, 43, 2, 0, 9500.00),
(161, 115, 48, 2, 2, 2800.00),
(165, 116, 45, 5, 4, 5800.00),
(166, 116, 43, 5, 2, 9500.00),
(167, 116, 48, 5, 2, 2800.00),
(168, 116, 42, 2, 0, 8500.00),
(172, 117, 42, 2, 0, 8500.00),
(173, 117, 43, 1, 0, 9500.00),
(181, 118, 37, 1, 0, 28500.00),
(182, 118, 38, 2, 0, 22500.00),
(183, 118, 41, 2, 0, 78500.00),
(184, 118, 39, 1, 0, 32500.00),
(185, 118, 46, 1, 0, 3500.00),
(186, 118, 40, 1, 0, 48500.00),
(187, 118, 47, 1, 0, 4800.00),
(188, 118, 37, 2, 0, 28500.00),
(192, 119, 42, 2, 0, 8500.00),
(193, 119, 45, 3, 0, 5800.00),
(194, 119, 49, 1, 0, 4500.00),
(197, 120, 45, 4, 4, 5800.00),
(198, 120, 42, 3, 3, 8500.00);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return`
--

CREATE TABLE `purchase_return` (
  `purchase_return_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `return_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','confirmed','returned') NOT NULL DEFAULT 'pending',
  `created_by` int(11) NOT NULL,
  `reference_no` varchar(30) NOT NULL,
  `remarks` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_return`
--

INSERT INTO `purchase_return` (`purchase_return_id`, `supplier_id`, `location_id`, `return_date`, `status`, `created_by`, `reference_no`, `remarks`) VALUES
(11, 4, 7, '2025-09-27 03:19:53', 'confirmed', 27, 'PR-0011', NULL),
(13, 4, 7, '2025-09-27 03:56:09', 'confirmed', 27, 'PR-0013', NULL),
(15, 4, 7, '2025-09-27 04:10:22', 'returned', 27, 'PR-0015', NULL),
(16, 4, 7, '2025-09-27 04:30:00', 'returned', 27, 'PR-0016', NULL),
(18, 4, 7, '2025-10-02 04:02:55', 'returned', 27, 'PR-0018', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return_items`
--

CREATE TABLE `purchase_return_items` (
  `purchase_return_items_id` int(11) NOT NULL,
  `purchase_return_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `return_qty` int(11) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `line_note` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_return_items`
--

INSERT INTO `purchase_return_items` (`purchase_return_items_id`, `purchase_return_id`, `product_id`, `return_qty`, `unit_cost`, `line_note`) VALUES
(1, 11, 45, 2, 5800.00, 'dsa'),
(2, 11, 43, 1, 9500.00, 'sda'),
(3, 13, 45, 1, 5800.00, 'sd'),
(4, 13, 42, 1, 8500.00, '2'),
(5, 15, 45, 2, 5800.00, 'a'),
(6, 15, 43, 2, 9500.00, 'a'),
(7, 16, 45, 5, 5800.00, 's'),
(8, 16, 42, 4, 8500.00, 'd'),
(9, 18, 45, 1, 5800.00, '2'),
(10, 18, 45, 1, 5800.00, '1');

-- --------------------------------------------------------

--
-- Table structure for table `salestransaction`
--

CREATE TABLE `salestransaction` (
  `transaction_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `terminal_id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `salestransaction`
--

INSERT INTO `salestransaction` (`transaction_id`, `staff_id`, `terminal_id`, `date`, `total`) VALUES
(1, 1, 1, '2025-09-04 15:07:15', 15200.00),
(2, 1, 1, '2025-09-22 13:20:17', 1.00),
(3, 28, 2, '2025-09-22 15:17:24', 2.00),
(4, 28, 1, '2025-09-22 15:29:37', 9200.00),
(5, 28, 1, '2025-09-24 14:57:04', 9200.00),
(6, 28, 1, '2025-09-24 17:28:12', 15600.00),
(7, 28, 1, '2025-09-24 17:37:59', 15600.00),
(8, 28, 1, '2025-09-24 17:38:04', 15600.00),
(9, 28, 1, '2025-09-24 17:39:22', 15600.00),
(10, 28, 1, '2025-09-24 17:39:25', 15600.00),
(11, 28, 1, '2025-09-24 17:40:19', 9200.00),
(12, 28, 1, '2025-09-24 17:41:54', 9200.00),
(13, 28, 1, '2025-09-24 17:49:58', 9200.00),
(14, 28, 1, '2025-09-24 17:50:21', 9200.00),
(15, 28, 1, '2025-09-24 18:03:43', 59600.00),
(16, 28, 3, '2025-09-25 11:57:43', 9200.00),
(17, 28, 3, '2025-09-25 19:45:52', 9200.00),
(18, 28, 4, '2025-09-25 19:55:29', 3200.00),
(19, 28, 6, '2025-09-25 19:56:04', 3200.00),
(20, 28, 1, '2025-10-02 09:31:00', 9200.00),
(21, 28, 1, '2025-10-02 14:03:57', 9200.00),
(22, 28, 5, '2025-10-08 07:21:39', 12800.00),
(23, 28, 5, '2025-10-08 07:22:22', 6400.00),
(24, 28, 5, '2025-10-08 07:23:37', 6400.00),
(25, 28, 5, '2025-10-08 07:26:34', 6400.00),
(26, 28, 1, '2025-10-08 07:30:22', 6400.00),
(27, 28, 7, '2025-10-08 07:36:23', 25600.00);

-- --------------------------------------------------------

--
-- Table structure for table `sales_return`
--

CREATE TABLE `sales_return` (
  `return_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `return_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reason` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_return`
--

INSERT INTO `sales_return` (`return_id`, `transaction_id`, `staff_id`, `return_date`, `reason`) VALUES
(9, 19, 9, '2025-10-02 08:20:07', 'sdas'),
(10, 20, 9, '2025-10-02 09:35:18', 'SDSA'),
(14, 21, 9, '2025-10-02 14:04:47', 'dsa');

-- --------------------------------------------------------

--
-- Table structure for table `sales_return_items`
--

CREATE TABLE `sales_return_items` (
  `return_item_id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_return_items`
--

INSERT INTO `sales_return_items` (`return_item_id`, `return_id`, `product_id`, `qty`, `refund_amount`, `unit_price`) VALUES
(1, 9, 48, 1, 3200.00, 3200.00),
(2, 10, 42, 1, 9200.00, 9200.00),
(3, 14, 42, 1, 9200.00, 9200.00);

-- --------------------------------------------------------

--
-- Table structure for table `shift`
--

CREATE TABLE `shift` (
  `shift_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shift`
--

INSERT INTO `shift` (`shift_id`, `staff_id`, `start_time`, `end_time`) VALUES
(1, 1, '2025-08-06 09:49:54', '2025-08-06 09:49:54'),
(2, 1, '2025-08-06 09:50:15', '2025-08-06 09:50:15'),
(3, 1, '2025-08-06 09:54:45', '2025-08-06 09:54:45'),
(4, 1, '2025-08-06 09:55:10', '2025-08-06 09:55:10'),
(5, 1, '2025-08-06 09:57:18', '2025-08-06 09:57:18'),
(6, 1, '2025-08-06 09:59:48', '2025-08-06 09:59:48'),
(7, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(8, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(9, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(10, 1, '2025-08-06 09:59:54', '2025-08-06 09:59:54'),
(11, 1, '2025-08-06 09:59:55', '2025-08-06 09:59:55'),
(12, 1, '2025-08-06 09:59:55', '2025-08-06 09:59:55'),
(13, 1, '2025-08-06 10:00:00', '2025-08-06 10:00:00'),
(14, 1, '2025-08-06 10:00:09', '2025-08-06 10:00:09'),
(15, 1, '2025-08-06 10:00:32', '2025-08-06 10:00:32'),
(16, 1, '2025-08-06 10:00:52', '2025-08-06 10:00:52'),
(17, 1, '2025-08-06 10:03:30', '2025-08-06 10:03:30'),
(18, 2, '2025-08-06 10:03:57', '2025-08-06 10:03:57'),
(19, 1, '2025-08-06 10:07:49', '2025-08-06 10:09:48'),
(20, 1, '2025-08-06 10:09:59', '2025-08-06 10:10:23'),
(21, 1, '2025-08-06 10:10:26', NULL),
(22, 1, '2025-08-10 14:35:40', NULL),
(23, 1, '2025-08-10 14:37:15', NULL),
(24, 1, '2025-08-10 14:58:11', '2025-08-10 15:08:30'),
(25, 2, '2025-08-10 15:08:59', NULL),
(26, 2, '2025-08-10 15:16:37', '2025-08-10 15:33:54'),
(27, 1, '2025-08-10 15:33:59', '2025-08-10 16:05:35'),
(28, 1, '2025-08-10 15:40:04', '2025-08-10 16:04:37'),
(29, 2, '2025-08-10 16:04:42', '2025-08-10 16:05:17'),
(30, 1, '2025-08-10 16:05:23', '2025-08-10 16:05:28'),
(31, 2, '2025-08-10 16:05:41', NULL),
(32, 1, '2025-08-12 02:53:49', NULL),
(33, 1, '2025-08-12 03:46:27', '2025-08-12 03:48:16'),
(34, 2, '2025-08-12 03:48:29', NULL),
(35, 1, '2025-08-12 14:02:30', '2025-08-12 15:00:02'),
(36, 1, '2025-08-12 15:00:07', '2025-08-12 16:49:05'),
(37, 1, '2025-08-12 16:50:15', '2025-08-12 16:50:19'),
(38, 1, '2025-08-12 16:51:20', NULL),
(39, 1, '2025-08-13 18:38:25', '2025-08-14 03:56:16'),
(40, 1, '2025-08-14 03:56:25', NULL),
(41, 1, '2025-08-14 04:06:52', NULL),
(42, 1, '2025-08-14 04:23:58', '2025-08-14 04:24:44'),
(43, 2, '2025-08-14 04:24:50', '2025-08-14 04:25:41'),
(44, 1, '2025-08-14 04:25:57', '2025-08-14 05:13:46'),
(45, 1, '2025-08-14 05:13:56', '2025-08-14 05:41:53'),
(46, 1, '2025-08-14 05:42:07', '2025-08-14 06:15:23'),
(47, 1, '2025-08-14 06:15:30', NULL),
(48, 1, '2025-08-14 12:26:03', '2025-08-14 12:43:54'),
(49, 1, '2025-08-14 12:43:58', '2025-08-14 12:44:02'),
(50, 1, '2025-08-14 12:44:07', '2025-08-14 16:01:40'),
(51, 1, '2025-08-14 16:01:44', '2025-08-14 16:05:49'),
(52, 1, '2025-08-14 16:05:53', '2025-08-14 16:23:53'),
(53, 1, '2025-08-14 16:23:57', '2025-08-14 16:37:06'),
(54, 1, '2025-08-14 16:37:09', NULL),
(55, 1, '2025-08-14 16:37:22', NULL),
(56, 1, '2025-08-14 16:39:08', '2025-08-14 17:13:17'),
(57, 1, '2025-08-14 17:13:22', NULL),
(58, 1, '2025-08-14 17:20:43', NULL),
(59, 1, '2025-08-14 18:17:21', '2025-08-14 18:28:14'),
(60, 1, '2025-08-14 18:28:18', '2025-08-14 18:37:25'),
(61, 1, '2025-08-14 18:37:30', '2025-08-14 18:38:02'),
(62, 1, '2025-08-14 18:38:05', '2025-08-14 18:41:23'),
(63, 1, '2025-08-14 18:41:27', NULL),
(64, 1, '2025-08-14 18:41:39', '2025-08-14 18:50:31'),
(65, 1, '2025-08-14 19:06:39', '2025-08-14 19:08:23'),
(66, 1, '2025-08-14 19:08:27', '2025-08-14 19:10:41'),
(67, 1, '2025-08-14 19:10:46', NULL),
(68, 1, '2025-08-14 19:23:07', '2025-08-14 19:23:14'),
(69, 1, '2025-08-14 19:23:20', '2025-08-14 19:29:53'),
(70, 1, '2025-08-14 19:29:57', NULL),
(71, 1, '2025-08-14 23:24:26', NULL),
(72, 1, '2025-08-14 23:43:31', '2025-08-14 23:50:37'),
(73, 1, '2025-08-14 23:50:54', '2025-08-14 23:59:17'),
(74, 1, '2025-08-14 23:59:20', NULL),
(75, 1, '2025-08-15 00:14:42', '2025-08-15 00:17:20'),
(76, 1, '2025-08-15 00:17:32', '2025-08-15 00:19:26'),
(77, 1, '2025-08-15 00:19:37', NULL),
(78, 1, '2025-08-15 00:22:30', NULL),
(79, 1, '2025-08-15 00:30:32', '2025-08-15 00:34:51'),
(80, 1, '2025-08-15 00:35:02', '2025-08-15 00:39:11'),
(81, 1, '2025-08-15 00:41:21', NULL),
(82, 1, '2025-08-15 00:44:04', '2025-08-15 00:53:45'),
(83, 1, '2025-08-15 00:53:59', NULL),
(84, 1, '2025-08-15 00:55:01', NULL),
(85, 1, '2025-08-15 00:56:54', NULL),
(86, 1, '2025-08-15 00:57:34', NULL),
(87, 1, '2025-08-15 01:07:45', NULL),
(88, 1, '2025-08-15 01:13:41', NULL),
(89, 1, '2025-08-15 01:14:17', NULL),
(90, 1, '2025-08-15 01:15:28', NULL),
(91, 1, '2025-08-15 01:20:08', NULL),
(92, 1, '2025-08-15 01:20:52', NULL),
(93, 1, '2025-08-15 07:16:49', '2025-08-15 07:17:15'),
(94, 1, '2025-08-15 07:17:19', '2025-08-15 07:18:28'),
(95, 1, '2025-08-15 07:18:58', '2025-08-15 07:20:06'),
(96, 1, '2025-08-15 07:21:07', '2025-08-15 07:22:09'),
(97, 2, '2025-08-15 07:25:06', NULL),
(98, 1, '2025-08-15 07:27:10', NULL),
(99, 2, '2025-08-15 07:27:22', NULL),
(100, 1, '2025-08-15 07:29:21', '2025-08-15 07:41:17'),
(101, 1, '2025-08-15 07:41:52', NULL),
(102, 1, '2025-08-15 07:43:51', NULL),
(103, 1, '2025-08-15 07:54:11', '2025-08-15 07:54:16'),
(104, 1, '2025-08-15 07:57:27', NULL),
(105, 1, '2025-08-15 08:04:02', NULL),
(106, 1, '2025-08-15 08:42:36', '2025-08-15 08:45:33'),
(107, 1, '2025-08-15 10:12:11', '2025-08-15 10:43:32'),
(108, 1, '2025-08-15 10:43:43', NULL),
(109, 1, '2025-08-16 01:02:01', '2025-08-16 01:11:50'),
(110, 9, '2025-08-16 01:12:00', '2025-08-16 01:12:04'),
(111, 9, '2025-08-16 01:12:09', '2025-08-16 01:13:35'),
(112, 13, '2025-08-16 01:13:36', NULL),
(113, 9, '2025-08-25 08:10:51', '2025-09-03 13:47:46'),
(114, 9, '2025-08-25 08:11:15', '2025-09-03 13:47:29'),
(115, 9, '2025-08-25 08:35:29', '2025-09-02 06:17:34'),
(116, 9, '2025-08-25 08:37:02', '2025-09-02 05:16:24'),
(117, 9, '2025-08-25 08:44:56', '2025-08-28 14:14:58'),
(118, 9, '2025-08-25 08:46:58', '2025-08-25 09:08:17'),
(119, 9, '2025-08-25 09:08:31', '2025-08-25 09:08:41'),
(120, 9, '2025-08-25 09:08:55', '2025-08-25 09:09:21'),
(121, 9, '2025-08-25 09:13:42', '2025-08-25 09:14:18'),
(122, 19, '2025-08-25 09:14:22', '2025-08-25 09:14:27'),
(123, 19, '2025-08-25 09:14:34', '2025-08-25 09:15:22'),
(124, 9, '2025-08-25 09:15:33', '2025-08-28 14:12:26'),
(125, 9, '2025-08-25 09:21:49', '2025-08-25 09:22:54'),
(126, 23, '2025-08-25 09:22:58', NULL),
(127, 9, '2025-08-25 09:48:31', '2025-08-28 14:10:21'),
(128, 9, '2025-08-25 13:44:02', '2025-08-28 13:43:43'),
(129, 9, '2025-08-25 13:45:51', '2025-08-28 13:24:10'),
(130, 9, '2025-08-27 05:31:10', '2025-08-28 13:23:16'),
(131, 9, '2025-08-27 05:34:21', '2025-08-27 06:09:23'),
(132, 9, '2025-08-27 05:47:59', '2025-08-27 05:50:09'),
(133, 24, '2025-08-27 05:50:19', NULL),
(134, 24, '2025-08-27 05:50:20', NULL),
(135, 24, '2025-08-27 05:50:21', NULL),
(136, 24, '2025-08-27 05:50:24', NULL),
(137, 24, '2025-08-27 05:51:28', NULL),
(138, 24, '2025-08-27 05:51:29', NULL),
(139, 24, '2025-08-27 05:51:41', NULL),
(140, 24, '2025-08-27 05:51:41', NULL),
(141, 24, '2025-08-27 05:55:15', NULL),
(142, 24, '2025-08-27 05:55:15', NULL),
(143, 24, '2025-08-27 05:55:15', NULL),
(144, 24, '2025-08-27 05:55:16', NULL),
(145, 24, '2025-08-27 05:55:24', NULL),
(146, 24, '2025-08-27 05:55:27', NULL),
(147, 24, '2025-08-27 05:55:27', NULL),
(148, 24, '2025-08-27 05:55:28', NULL),
(149, 24, '2025-08-27 05:55:28', NULL),
(150, 24, '2025-08-27 05:55:28', NULL),
(151, 24, '2025-08-27 05:56:41', NULL),
(152, 24, '2025-08-27 05:56:41', NULL),
(153, 24, '2025-08-27 05:56:42', NULL),
(154, 24, '2025-08-27 05:56:42', NULL),
(155, 24, '2025-08-27 05:56:42', NULL),
(156, 24, '2025-08-27 05:59:00', NULL),
(157, 24, '2025-08-27 05:59:01', NULL),
(158, 24, '2025-08-27 05:59:01', NULL),
(159, 24, '2025-08-27 05:59:01', NULL),
(160, 24, '2025-08-27 05:59:01', NULL),
(161, 24, '2025-08-27 05:59:02', NULL),
(162, 24, '2025-08-27 05:59:02', NULL),
(163, 24, '2025-08-27 05:59:17', NULL),
(164, 24, '2025-08-27 06:01:24', NULL),
(165, 24, '2025-08-27 06:01:25', NULL),
(166, 24, '2025-08-27 06:01:30', NULL),
(167, 24, '2025-08-27 06:01:30', NULL),
(168, 24, '2025-08-27 06:01:30', NULL),
(169, 24, '2025-08-27 06:01:30', NULL),
(170, 24, '2025-08-27 06:01:30', NULL),
(171, 24, '2025-08-27 06:04:46', NULL),
(172, 24, '2025-08-27 06:04:47', NULL),
(173, 24, '2025-08-27 06:04:47', NULL),
(174, 24, '2025-08-27 06:04:47', NULL),
(175, 24, '2025-08-27 06:04:48', NULL),
(176, 24, '2025-08-27 06:04:48', NULL),
(177, 24, '2025-08-27 06:04:48', NULL),
(178, 24, '2025-08-27 06:04:48', NULL),
(179, 24, '2025-08-27 06:04:48', NULL),
(180, 24, '2025-08-27 06:04:49', NULL),
(181, 24, '2025-08-27 06:04:49', NULL),
(182, 24, '2025-08-27 06:04:49', NULL),
(183, 24, '2025-08-27 06:04:49', NULL),
(184, 24, '2025-08-27 06:04:50', NULL),
(185, 24, '2025-08-27 06:04:50', NULL),
(186, 24, '2025-08-27 06:04:50', NULL),
(187, 24, '2025-08-27 06:04:50', NULL),
(188, 24, '2025-08-27 06:04:50', NULL),
(189, 24, '2025-08-27 06:04:51', NULL),
(190, 24, '2025-08-27 06:04:51', NULL),
(191, 24, '2025-08-27 06:04:51', NULL),
(192, 24, '2025-08-27 06:04:51', NULL),
(193, 24, '2025-08-27 06:04:51', NULL),
(194, 24, '2025-08-27 06:04:52', NULL),
(195, 24, '2025-08-27 06:04:52', NULL),
(196, 24, '2025-08-27 06:04:52', NULL),
(197, 24, '2025-08-27 06:04:52', NULL),
(198, 24, '2025-08-27 06:04:52', NULL),
(199, 24, '2025-08-27 06:04:53', NULL),
(200, 24, '2025-08-27 06:04:53', NULL),
(201, 24, '2025-08-27 06:04:53', NULL),
(202, 9, '2025-08-27 06:09:25', '2025-08-27 06:09:28'),
(203, 9, '2025-08-27 06:09:48', '2025-08-27 06:14:21'),
(204, 24, '2025-08-27 06:09:56', NULL),
(205, 24, '2025-08-27 06:09:58', NULL),
(206, 24, '2025-08-27 06:09:58', NULL),
(207, 24, '2025-08-27 06:09:58', NULL),
(208, 24, '2025-08-27 06:09:58', NULL),
(209, 24, '2025-08-27 06:09:59', NULL),
(210, 24, '2025-08-27 06:09:59', NULL),
(211, 24, '2025-08-27 06:09:59', NULL),
(212, 24, '2025-08-27 06:09:59', NULL),
(213, 24, '2025-08-27 06:09:59', NULL),
(214, 24, '2025-08-27 06:10:00', NULL),
(215, 24, '2025-08-27 06:10:00', NULL),
(216, 24, '2025-08-27 06:10:00', NULL),
(217, 24, '2025-08-27 06:10:01', NULL),
(218, 24, '2025-08-27 06:10:01', NULL),
(219, 24, '2025-08-27 06:10:01', NULL),
(220, 24, '2025-08-27 06:10:02', NULL),
(221, 24, '2025-08-27 06:10:02', NULL),
(222, 24, '2025-08-27 06:10:02', NULL),
(223, 24, '2025-08-27 06:10:02', NULL),
(224, 24, '2025-08-27 06:10:02', NULL),
(225, 24, '2025-08-27 06:14:24', NULL),
(226, 24, '2025-08-27 06:14:24', NULL),
(227, 24, '2025-08-27 06:14:24', NULL),
(228, 24, '2025-08-27 06:14:25', NULL),
(229, 9, '2025-08-27 06:20:30', '2025-08-27 07:48:05'),
(230, 24, '2025-08-27 06:20:37', NULL),
(231, 24, '2025-08-27 06:21:55', NULL),
(232, 24, '2025-08-27 06:22:11', NULL),
(233, 24, '2025-08-27 06:29:22', NULL),
(234, 25, '2025-08-27 06:29:51', NULL),
(235, 24, '2025-08-27 06:33:19', NULL),
(236, 24, '2025-08-27 06:37:42', NULL),
(237, 24, '2025-08-27 06:41:07', '2025-08-28 12:51:19'),
(238, 24, '2025-08-27 06:47:23', '2025-08-28 12:50:49'),
(239, 24, '2025-08-27 06:52:54', '2025-08-27 07:11:36'),
(240, 9, '2025-08-27 06:55:02', '2025-08-27 06:55:04'),
(241, 24, '2025-08-27 06:55:09', '2025-08-27 06:59:20'),
(242, 9, '2025-08-27 06:59:24', '2025-08-27 06:59:34'),
(243, 25, '2025-08-27 06:59:43', '2025-08-27 07:06:52'),
(244, 9, '2025-08-27 07:07:03', '2025-08-27 07:10:48'),
(245, 9, '2025-08-27 07:13:17', '2025-08-27 07:30:43'),
(246, 27, '2025-08-27 07:13:50', '2025-08-27 07:17:12'),
(247, 27, '2025-08-27 07:17:38', '2025-08-27 07:17:55'),
(248, 26, '2025-08-27 07:17:59', '2025-08-27 07:20:02'),
(249, 9, '2025-08-27 07:30:46', '2025-08-27 07:31:20'),
(250, 9, '2025-08-27 07:31:50', '2025-08-27 07:39:21'),
(251, 27, '2025-08-27 07:39:28', '2025-09-21 13:48:37'),
(252, 27, '2025-08-27 07:39:28', '2025-09-21 12:32:20'),
(253, 27, '2025-08-27 07:39:29', '2025-09-21 12:11:17'),
(254, 27, '2025-08-27 07:39:29', '2025-09-21 10:24:52'),
(255, 27, '2025-08-27 07:39:30', '2025-09-13 00:42:04'),
(256, 27, '2025-08-27 07:39:30', '2025-09-05 18:28:30'),
(257, 27, '2025-08-27 07:39:30', '2025-09-05 16:13:37'),
(258, 27, '2025-08-27 07:39:31', '2025-09-05 15:40:22'),
(259, 27, '2025-08-27 07:39:31', '2025-09-05 15:22:42'),
(260, 27, '2025-08-27 07:39:31', '2025-09-05 13:55:01'),
(261, 27, '2025-08-27 07:39:40', '2025-09-04 15:01:27'),
(262, 28, '2025-08-27 07:48:07', '2025-08-27 07:51:04'),
(263, 28, '2025-08-27 07:51:10', '2025-08-27 07:56:49'),
(264, 9, '2025-08-27 07:57:04', '2025-08-27 08:01:49'),
(265, 28, '2025-08-27 08:02:00', '2025-08-27 08:02:05'),
(266, 9, '2025-08-27 08:02:11', '2025-08-28 13:23:08'),
(267, 27, '2025-08-27 08:58:19', '2025-09-04 15:00:34'),
(268, 9, '2025-08-27 09:26:44', '2025-08-28 13:19:40'),
(269, 9, '2025-08-27 09:27:23', '2025-08-28 13:19:29'),
(270, 9, '2025-08-27 09:37:22', '2025-08-28 13:18:39'),
(271, 9, '2025-08-27 09:43:02', '2025-08-28 13:18:32'),
(272, 9, '2025-08-27 10:02:11', '2025-08-28 13:17:59'),
(273, 9, '2025-08-27 10:02:26', '2025-08-28 13:17:51'),
(274, 9, '2025-08-27 10:06:23', '2025-08-28 13:17:43'),
(275, 9, '2025-08-27 10:43:03', '2025-08-28 13:17:28'),
(276, 9, '2025-08-27 10:54:59', '2025-08-28 13:16:29'),
(277, 9, '2025-08-27 11:12:00', '2025-08-28 13:15:37'),
(278, 9, '2025-08-27 11:29:48', '2025-08-28 13:15:32'),
(279, 9, '2025-08-27 11:38:08', '2025-08-28 13:15:07'),
(280, 9, '2025-08-27 11:39:05', '2025-08-28 13:11:31'),
(281, 9, '2025-08-27 11:57:16', '2025-08-28 13:10:51'),
(282, 9, '2025-08-27 12:21:11', '2025-08-28 13:10:39'),
(283, 9, '2025-08-27 12:21:45', '2025-08-28 12:51:32'),
(284, 9, '2025-08-27 12:40:43', '2025-08-28 12:51:02'),
(285, 27, '2025-08-27 12:43:28', '2025-09-04 04:30:29'),
(286, 27, '2025-08-27 12:54:32', '2025-09-03 13:48:39'),
(287, 27, '2025-08-27 12:58:09', '2025-08-28 14:13:31'),
(288, 27, '2025-08-27 13:05:37', '2025-08-28 13:25:04'),
(289, 27, '2025-08-27 13:24:27', '2025-08-28 13:24:19'),
(290, 27, '2025-08-27 13:25:03', '2025-08-28 13:16:23'),
(291, 27, '2025-08-27 13:32:07', '2025-08-28 12:49:58'),
(292, 27, '2025-08-27 13:36:03', '2025-08-28 06:02:38'),
(293, 9, '2025-08-28 03:36:52', '2025-08-28 12:50:34'),
(294, 9, '2025-08-28 03:36:52', '2025-08-28 11:38:59'),
(295, 9, '2025-08-28 03:36:52', '2025-08-28 04:25:19'),
(296, 9, '2025-08-28 04:08:20', '2025-08-28 04:24:23'),
(297, 26, '2025-08-28 04:25:31', NULL),
(298, 28, '2025-09-03 13:48:44', '2025-09-03 13:48:53'),
(299, 9, '2025-09-03 14:03:14', '2025-09-03 14:14:05'),
(300, 29, '2025-09-03 14:14:12', NULL),
(301, 9, '2025-09-04 04:27:42', '2025-09-04 04:29:12'),
(302, 9, '2025-09-04 04:30:32', '2025-09-04 04:30:51'),
(303, 9, '2025-09-04 04:57:29', '2025-09-04 04:57:35'),
(304, 9, '2025-09-04 04:57:41', '2025-09-04 04:57:45'),
(305, 9, '2025-09-04 05:06:26', '2025-09-04 05:06:30'),
(306, 9, '2025-09-04 05:07:35', '2025-09-04 05:07:39'),
(307, 9, '2025-09-04 05:08:03', '2025-09-04 05:08:07'),
(308, 9, '2025-09-04 05:13:14', '2025-09-04 05:14:17'),
(309, 9, '2025-09-04 05:14:25', '2025-09-04 10:19:10'),
(310, 9, '2025-09-04 10:19:19', '2025-09-04 10:19:23'),
(311, 9, '2025-09-04 10:24:10', '2025-09-04 14:59:03'),
(312, 28, '2025-09-04 14:57:05', '2025-09-04 14:57:31'),
(313, 28, '2025-09-04 14:59:06', '2025-09-04 15:00:06'),
(314, 9, '2025-09-04 15:00:38', '2025-09-04 15:01:11'),
(315, 9, '2025-09-04 15:01:29', '2025-09-04 15:01:43'),
(316, 28, '2025-09-04 15:01:46', '2025-09-04 15:08:31'),
(317, 9, '2025-09-04 15:08:34', '2025-09-05 00:00:34'),
(318, 9, '2025-09-05 00:01:12', '2025-09-05 00:01:16'),
(319, 9, '2025-09-05 00:01:32', '2025-09-05 00:02:10'),
(320, 9, '2025-09-05 00:02:13', '2025-09-05 00:25:29'),
(321, 9, '2025-09-05 00:25:35', '2025-09-05 13:14:38'),
(322, 9, '2025-09-05 15:22:44', '2025-09-05 15:23:54'),
(323, 9, '2025-09-05 15:27:11', '2025-09-05 15:27:22'),
(324, 9, '2025-09-05 15:27:37', '2025-09-05 15:41:15'),
(325, 9, '2025-09-05 15:41:18', '2025-09-05 15:43:24'),
(326, 9, '2025-09-05 15:43:31', '2025-09-05 15:43:36'),
(327, 9, '2025-09-05 15:44:07', '2025-09-05 15:44:15'),
(328, 9, '2025-09-05 15:44:17', '2025-09-05 15:44:22'),
(329, 9, '2025-09-05 15:44:25', '2025-09-05 16:00:07'),
(330, 9, '2025-09-05 16:13:43', '2025-09-05 16:21:03'),
(331, 9, '2025-09-05 16:21:25', '2025-09-05 16:26:10'),
(332, 9, '2025-09-05 18:28:33', '2025-09-05 18:28:39'),
(333, 9, '2025-09-05 18:29:08', '2025-09-05 18:30:16'),
(334, 9, '2025-09-13 00:38:49', '2025-09-13 00:41:55'),
(335, 9, '2025-09-17 09:19:51', '2025-09-17 09:20:15'),
(336, 9, '2025-09-21 05:40:39', '2025-09-21 05:40:42'),
(337, 9, '2025-09-21 10:30:47', '2025-09-21 10:30:51'),
(338, 9, '2025-09-21 12:11:21', '2025-09-21 12:17:47'),
(339, 9, '2025-09-21 12:32:24', '2025-09-21 13:46:55'),
(340, 9, '2025-09-21 13:48:42', '2025-09-21 14:48:13'),
(341, 9, '2025-09-21 14:48:16', '2025-09-21 15:10:05'),
(342, 9, '2025-09-21 15:10:09', '2025-09-21 15:10:12'),
(343, 27, '2025-09-21 15:10:18', '2025-09-21 15:21:21'),
(344, 9, '2025-09-21 15:21:25', '2025-09-22 13:19:58'),
(345, 28, '2025-09-22 13:20:02', '2025-09-22 15:08:35'),
(346, 27, '2025-09-22 13:26:49', '2025-09-22 15:43:14'),
(347, 28, '2025-09-22 15:08:41', '2025-09-22 15:22:26'),
(348, 28, '2025-09-22 15:22:30', '2025-09-22 15:43:19'),
(349, 9, '2025-09-22 15:43:27', '2025-09-23 13:59:18'),
(350, 27, '2025-09-23 13:42:03', '2025-09-23 13:59:10'),
(351, 28, '2025-09-23 13:59:23', '2025-09-23 13:59:28'),
(352, 27, '2025-09-23 14:02:29', '2025-09-23 15:30:03'),
(353, 9, '2025-09-23 14:14:12', '2025-09-23 14:40:02'),
(354, 9, '2025-09-23 14:40:07', '2025-09-23 15:28:55'),
(355, 9, '2025-09-23 15:30:15', '2025-09-23 17:54:08'),
(356, 27, '2025-09-23 15:51:17', '2025-09-23 17:10:35'),
(357, 27, '2025-09-23 17:10:40', '2025-09-23 17:12:22'),
(358, 27, '2025-09-23 17:17:10', '2025-09-23 17:52:38'),
(359, 27, '2025-09-23 17:54:11', '2025-09-23 19:50:08'),
(360, 28, '2025-09-23 19:50:12', '2025-09-23 19:59:54'),
(361, 9, '2025-09-23 19:59:58', '2025-09-23 20:04:26'),
(362, 28, '2025-09-23 20:02:35', '2025-09-23 20:03:21'),
(363, 27, '2025-09-23 20:04:31', '2025-09-23 20:04:48'),
(364, 28, '2025-09-23 20:04:52', '2025-09-25 06:31:14'),
(365, 9, '2025-09-24 15:19:05', '2025-09-25 05:08:18'),
(366, 27, '2025-09-25 03:54:27', '2025-09-25 04:45:29'),
(367, 31, '2025-09-25 05:12:18', '2025-09-25 05:28:59'),
(368, 27, '2025-09-25 05:29:08', '2025-09-25 05:38:31'),
(369, 31, '2025-09-25 05:38:39', '2025-09-25 05:43:54'),
(370, 27, '2025-09-25 05:43:27', '2025-09-25 06:31:27'),
(371, 31, '2025-09-25 05:43:58', '2025-09-25 09:59:33'),
(372, 9, '2025-09-25 06:31:31', '2025-09-25 11:01:14'),
(373, 27, '2025-09-25 09:43:43', '2025-09-25 09:43:55'),
(374, 27, '2025-09-25 09:59:39', '2025-09-25 10:00:52'),
(375, 31, '2025-09-25 10:01:08', '2025-09-25 17:01:42'),
(376, 27, '2025-09-25 10:58:32', '2025-09-25 11:00:34'),
(377, 32, '2025-09-25 11:01:17', '2025-09-25 11:05:03'),
(378, 27, '2025-09-25 11:05:21', '2025-09-25 11:05:43'),
(379, 9, '2025-09-25 11:05:47', '2025-09-25 12:59:30'),
(380, 27, '2025-09-25 11:15:01', '2025-09-25 11:16:53'),
(381, 28, '2025-09-25 11:57:34', '2025-09-25 14:07:27'),
(382, 32, '2025-09-25 12:59:38', '2025-09-25 14:12:44'),
(383, 9, '2025-09-25 13:03:34', '2025-09-25 14:07:12'),
(384, 9, '2025-09-25 14:07:33', '2025-09-25 14:09:12'),
(385, 27, '2025-09-25 14:12:51', '2025-09-25 14:13:04'),
(386, 9, '2025-09-25 14:13:09', '2025-09-25 19:02:02'),
(387, 27, '2025-09-25 16:42:50', '2025-09-25 17:01:23'),
(388, 27, '2025-09-25 17:02:38', '2025-09-25 18:23:08'),
(389, 27, '2025-09-25 18:23:12', '2025-09-25 19:00:07'),
(390, 31, '2025-09-25 18:48:57', NULL),
(391, 28, '2025-09-25 19:00:14', '2025-09-25 19:00:20'),
(392, 27, '2025-09-25 19:02:11', '2025-09-25 19:15:31'),
(393, 28, '2025-09-25 19:06:17', '2025-09-25 19:07:44'),
(394, 9, '2025-09-25 19:07:49', '2025-09-25 19:18:09'),
(395, 27, '2025-09-25 19:18:16', '2025-09-25 19:20:32'),
(396, 9, '2025-09-25 19:20:35', '2025-09-25 19:44:41'),
(397, 27, '2025-09-25 19:44:46', '2025-09-25 19:44:58'),
(398, 28, '2025-09-25 19:45:11', '2025-09-25 19:45:17'),
(399, 28, '2025-09-25 19:45:33', '2025-09-25 19:46:25'),
(400, 9, '2025-09-25 19:46:30', '2025-09-25 19:47:05'),
(401, 27, '2025-09-25 19:47:12', '2025-09-25 19:47:19'),
(402, 9, '2025-09-25 19:47:23', '2025-09-25 19:53:13'),
(403, 9, '2025-09-25 19:53:27', '2025-09-25 19:53:41'),
(404, 9, '2025-09-25 19:54:08', '2025-09-25 19:54:49'),
(405, 28, '2025-09-25 19:54:57', '2025-09-25 19:55:08'),
(406, 9, '2025-09-25 19:55:13', '2025-09-25 19:55:18'),
(407, 28, '2025-09-25 19:55:21', '2025-09-25 19:55:33'),
(408, 9, '2025-09-25 19:55:36', '2025-09-25 19:55:51'),
(409, 28, '2025-09-25 19:55:54', '2025-09-25 19:56:08'),
(410, 9, '2025-09-25 19:56:16', '2025-09-26 14:19:27'),
(411, 27, '2025-09-26 14:19:34', '2025-09-26 14:23:28'),
(412, 9, '2025-09-26 14:23:34', '2025-09-26 14:48:35'),
(413, 27, '2025-09-26 14:48:40', '2025-09-27 02:35:06'),
(414, 9, '2025-09-26 14:50:55', '2025-09-27 01:13:23'),
(415, 27, '2025-09-27 02:35:11', '2025-09-27 02:35:17'),
(416, 9, '2025-09-27 02:35:21', '2025-10-02 04:01:56'),
(417, 27, '2025-09-27 02:40:02', '2025-10-02 04:03:11'),
(418, 28, '2025-10-02 04:03:15', '2025-10-02 04:30:28'),
(419, 9, '2025-10-02 04:30:34', '2025-10-02 09:30:37'),
(420, 28, '2025-10-02 04:44:42', '2025-10-02 21:02:34'),
(421, 9, '2025-10-02 09:34:29', '2025-10-02 09:40:22'),
(422, 27, '2025-10-02 09:40:26', '2025-10-02 09:44:07'),
(423, 9, '2025-10-02 09:44:11', '2025-10-02 13:31:51'),
(424, 27, '2025-10-02 09:44:55', '2025-10-02 09:49:24'),
(425, 9, '2025-10-02 13:31:56', '2025-10-02 13:32:42'),
(426, 9, '2025-10-02 14:03:33', '2025-10-02 14:38:43'),
(427, 9, '2025-10-02 14:38:49', '2025-10-02 21:28:20'),
(428, 27, '2025-10-02 20:25:13', '2025-10-02 20:28:46'),
(429, 27, '2025-10-02 20:28:52', '2025-10-02 21:29:36'),
(430, 9, '2025-10-02 21:29:41', '2025-10-03 00:04:26'),
(431, 27, '2025-10-02 23:42:45', '2025-10-03 00:41:25'),
(432, 9, '2025-10-03 00:07:30', '2025-10-03 00:07:33'),
(433, 9, '2025-10-03 00:41:29', '2025-10-05 12:24:46'),
(434, 27, '2025-10-03 01:09:11', NULL),
(435, 9, '2025-10-06 18:24:48', '2025-10-08 07:16:49'),
(436, 28, '2025-10-08 07:17:12', '2025-10-08 08:09:42'),
(437, 9, '2025-10-08 07:19:04', '2025-10-08 07:37:06'),
(438, 9, '2025-10-08 08:06:19', '2025-10-08 08:09:23'),
(439, 9, '2025-10-08 08:09:46', NULL),
(440, 28, '2025-10-11 07:12:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','cashier','warehouse_manager','warehouse_clerk','store_clerk') NOT NULL,
  `location_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `name`, `email`, `role`, `location_id`) VALUES
(1, 'jessie', 'jessie@gmail.com', 'admin', NULL),
(2, 'james', 'james@gmail.com', 'admin', NULL),
(3, 'dd', 'dd', '', NULL),
(4, 'jj1', 'hh', '', NULL),
(5, 'jj', 'jj', '', NULL),
(6, 'jj', 'sdsa', 'admin', NULL),
(7, 'jjj', 'jjj', 'admin', NULL),
(8, 'qwe', 'qwe', 'admin', NULL),
(9, 'GG', 'GG', 'admin', NULL),
(10, 'asd', 'asd', 'admin', NULL),
(11, 'Sandy Jean A. Panong', 'sandy@gmail.com', 'admin', NULL),
(12, 'admin', 'admin3', 'admin', NULL),
(13, 'admin123', 'admin123@gmail.com', 'admin', NULL),
(14, 'dsa', 'sdsa@dsa', 'warehouse_manager', 2),
(15, 'sdas', 'sdsa@dsa', 'warehouse_manager', 1),
(16, 'dsa', 'sdsa@dsa', 'cashier', NULL),
(17, 'Jessie', 'JessieJamesParajes@gmail.com', 'admin', NULL),
(18, 'JJ', 'JessieJamesParajes@gmail.com', 'admin', NULL),
(19, 'Jessie James', 'jeca.parajes.coc@phinmaed.com', 'admin', NULL),
(21, 'gg', 'sdf@gds', 'warehouse_manager', 1),
(22, 'dsa', 'ad@dsad', 'cashier', NULL),
(23, '12345', 'sdf@gds', 'admin', NULL),
(24, 'warehouse1', 'jeca.parajes.coc@phinmaed.com', 'warehouse_manager', 4),
(25, 'warehouse2', 'jeca.parajes.coc@phinmaed.com', 'warehouse_manager', 5),
(26, 'karel', 'jeca.parajes.coc@gmail.com', 'warehouse_manager', 6),
(27, 'paul', 'jeca.parajes.coc@gmail.com', 'warehouse_manager', 7),
(28, 'cashier1', 'jessiejamesparajes@gmail.com', 'cashier', NULL),
(29, 'Jessie James C. Parajes', 'jessiejamesparajes@gmail.com', 'admin', NULL),
(30, 'aa', 'aa@gdas', 'cashier', NULL),
(31, 'paul_clerk', 'paul_clerk@gmail.com', 'warehouse_clerk', 7),
(32, 'store_clerk1', 'store_clerk1@gmail.com', 'store_clerk', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `adjustment_id` int(11) NOT NULL,
  `reference_no` varchar(100) NOT NULL,
  `location_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `approve_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approve','','') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_adjustments`
--

INSERT INTO `stock_adjustments` (`adjustment_id`, `reference_no`, `location_id`, `created_by`, `approve_by`, `created_at`, `status`) VALUES
(6, 'ADJ-20250923-184615-bf93', 1, 9, 9, '2025-09-23 16:46:15', 'approve'),
(7, 'ADJ-20250923-185850-b2dd', 1, 9, 27, '2025-09-23 16:58:50', 'approve'),
(8, 'ADJ-20250923-192941-8fb4', 1, 27, NULL, '2025-09-23 17:29:41', 'pending'),
(9, 'ADJ-20250923-194242-2f75', 1, 27, NULL, '2025-09-23 17:42:42', 'pending'),
(10, 'ADJ-20250923-194328-c4b1', 1, 27, NULL, '2025-09-23 17:43:28', 'pending'),
(11, 'ADJ-20250923-195202-cdbc', 7, 27, NULL, '2025-09-23 17:52:02', 'pending'),
(12, 'ADJ-20250923-195206-d11f', 7, 27, 27, '2025-09-23 17:52:06', 'approve'),
(13, 'ADJ-20250923-195248-ffdc', 1, 9, NULL, '2025-09-23 17:52:48', 'pending'),
(14, 'ADJ-20250923-195258-aced', 1, 9, NULL, '2025-09-23 17:52:58', 'pending'),
(15, 'ADJ-20250923-195319-0047', 1, 9, 9, '2025-09-23 17:53:19', 'approve'),
(16, 'ADJ-20250923-195345-622a', 1, 9, NULL, '2025-09-23 17:53:45', 'pending'),
(17, 'ADJ-20250923-195352-5aed', 1, 9, NULL, '2025-09-23 17:53:52', 'pending'),
(18, 'ADJ-20250923-195354-3314', 1, 9, NULL, '2025-09-23 17:53:54', 'pending'),
(19, 'ADJ-20250923-195356-609d', 1, 9, NULL, '2025-09-23 17:53:56', 'pending'),
(20, 'ADJ-20250923-195427-5e20', 7, 27, NULL, '2025-09-23 17:54:27', 'pending'),
(21, 'ADJ-20250923-195446-5da0', 7, 27, NULL, '2025-09-23 17:54:46', 'pending'),
(22, 'ADJ-20250923-195448-180a', 7, 27, NULL, '2025-09-23 17:54:48', 'pending'),
(23, 'ADJ-20250923-195449-a9e4', 7, 27, NULL, '2025-09-23 17:54:49', 'pending'),
(24, 'ADJ-20250923-195450-2662', 7, 27, NULL, '2025-09-23 17:54:50', 'pending'),
(25, 'ADJ-20250923-195452-f7dd', 7, 27, NULL, '2025-09-23 17:54:52', 'pending'),
(26, 'ADJ-20250923-195536-613b', 7, 27, 27, '2025-09-23 17:55:36', 'approve'),
(27, 'ADJ-20250923-195559-4123', 7, 27, 27, '2025-09-23 17:55:59', 'approve'),
(28, 'ADJ-20250923-195633-43ae', 1, 9, 9, '2025-09-23 17:56:33', 'approve'),
(29, 'ADJ-20250923-203832-beab', 1, 9, 9, '2025-09-23 18:38:32', 'approve'),
(30, 'ADJ-20250923-204005-f29c', 7, 27, NULL, '2025-09-23 18:40:05', 'pending'),
(31, 'ADJ-20250923-204129-cbfe', 7, 27, 27, '2025-09-23 18:41:29', 'approve'),
(32, 'ADJ-0032', 7, 27, 27, '2025-09-23 19:28:07', 'approve'),
(33, 'ADJ-0033', 7, 27, 27, '2025-09-23 19:37:59', 'approve'),
(34, 'ADJ-0034', 7, 27, NULL, '2025-09-23 19:48:10', 'pending'),
(35, 'sad', 7, 31, 31, '2025-09-25 09:58:31', 'pending'),
(36, 'ADJ-0036', 1, 32, 9, '2025-09-25 11:03:25', 'approve');

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustment_items`
--

CREATE TABLE `stock_adjustment_items` (
  `adjustment_item_id` int(11) NOT NULL,
  `adjustment_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `old_quantity` int(11) NOT NULL,
  `new_quantity` int(11) NOT NULL,
  `change_quantity` int(11) NOT NULL,
  `reason` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_adjustment_items`
--

INSERT INTO `stock_adjustment_items` (`adjustment_item_id`, `adjustment_id`, `product_id`, `old_quantity`, `new_quantity`, `change_quantity`, `reason`) VALUES
(1, 6, 48, 2, 4, 2, ''),
(2, 7, 48, 4, 6, 2, ''),
(3, 8, 45, 20, 22, 2, ''),
(4, 9, 45, 20, 22, 2, ''),
(5, 10, 45, 20, 22, 2, ''),
(6, 12, 45, 20, 22, 2, ''),
(7, 15, 48, 6, 6, 0, ''),
(8, 26, 45, 22, 24, 2, ''),
(9, 27, 45, 24, 26, 2, ''),
(10, 28, 48, 6, 8, 2, ''),
(11, 29, 48, 8, 0, -8, ''),
(12, 30, 45, 26, 21, -5, 'guba'),
(13, 31, 45, 26, 24, -2, 'guba duwa'),
(14, 31, 42, 4, 5, 1, 'nakita'),
(15, 31, 43, 5, 6, 1, 'nakita'),
(16, 32, 45, 24, 22, -2, ''),
(17, 33, 45, 22, 15, -7, 'guba'),
(18, 33, 48, 3, 5, 2, 'nakita'),
(19, 34, 45, 15, 10, -5, ''),
(20, 34, 48, 5, 0, -5, ''),
(21, 35, 37, 2, 3, 2, 'ds'),
(22, 36, 42, 1, 3, 2, '');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `movement_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `movement_type` enum('in','out','transfer','adjust') NOT NULL,
  `qty` int(11) NOT NULL,
  `grn_id` int(11) DEFAULT NULL,
  `sales_id` int(11) DEFAULT NULL,
  `purchase_return_id` int(11) DEFAULT NULL,
  `sales_return_id` int(11) DEFAULT NULL,
  `stock_transfer_id` int(11) DEFAULT NULL,
  `stock_adjust_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) NOT NULL,
  `movement_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`movement_id`, `product_id`, `location_id`, `movement_type`, `qty`, `grn_id`, `sales_id`, `purchase_return_id`, `sales_return_id`, `stock_transfer_id`, `stock_adjust_id`, `reference_type`, `movement_date`) VALUES
(1, 48, 1, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 6, 'stock_adjustment', '2025-09-23 16:46:24'),
(2, 48, 1, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 7, 'stock_adjustment', '2025-09-23 16:59:56'),
(3, 45, 7, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 12, 'stock_adjustment', '2025-09-23 17:52:30'),
(4, 48, 1, 'adjust', 0, NULL, NULL, NULL, NULL, NULL, 15, 'stock_adjustment', '2025-09-23 17:53:29'),
(5, 45, 7, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 26, 'stock_adjustment', '2025-09-23 17:55:53'),
(6, 45, 7, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 27, 'stock_adjustment', '2025-09-23 17:56:12'),
(7, 48, 1, 'adjust', 2, NULL, NULL, NULL, NULL, NULL, 28, 'stock_adjustment', '2025-09-23 17:56:45');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfer`
--

CREATE TABLE `stock_transfer` (
  `stock_transfer_id` int(11) NOT NULL,
  `from_location_id` int(11) NOT NULL,
  `to_location_id` int(11) NOT NULL,
  `status` enum('pending','in_transit','completed') NOT NULL DEFAULT 'pending',
  `transfer_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `requested_by` int(11) NOT NULL,
  `approved_by` int(11) NOT NULL,
  `received_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transfer`
--

INSERT INTO `stock_transfer` (`stock_transfer_id`, `from_location_id`, `to_location_id`, `status`, `transfer_created`, `requested_by`, `approved_by`, `received_at`) VALUES
(30, 7, 1, 'pending', '2025-09-21 15:03:16', 9, 9, '2025-09-21 15:03:16'),
(31, 7, 1, 'completed', '2025-09-21 15:09:23', 9, 9, '2025-09-21 15:09:23'),
(32, 1, 7, 'completed', '2025-09-23 14:38:51', 9, 9, '2025-09-23 14:38:51'),
(33, 7, 1, 'completed', '2025-09-25 13:28:19', 9, 9, '2025-09-25 13:28:19'),
(34, 1, 7, 'completed', '2025-09-25 13:29:01', 9, 9, '2025-09-25 17:54:33'),
(35, 1, 7, 'in_transit', '2025-09-25 13:59:13', 9, 9, '2025-09-25 13:59:13'),
(36, 1, 6, 'in_transit', '2025-09-25 16:40:33', 9, 9, NULL),
(37, 7, 1, 'completed', '2025-09-25 18:01:15', 9, 9, '2025-09-25 18:05:53'),
(38, 1, 7, 'completed', '2025-09-25 18:01:31', 9, 9, '2025-09-25 18:04:37'),
(39, 7, 1, 'completed', '2025-10-08 07:20:14', 9, 9, '2025-10-08 07:20:59');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfer_items`
--

CREATE TABLE `stock_transfer_items` (
  `stock_transfer_item_id` int(11) NOT NULL,
  `stock_transfer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transfer_items`
--

INSERT INTO `stock_transfer_items` (`stock_transfer_item_id`, `stock_transfer_id`, `product_id`, `quantity`) VALUES
(5, 31, 42, 2),
(6, 31, 48, 2),
(7, 32, 42, 1),
(8, 33, 48, 2),
(9, 33, 42, 2),
(10, 34, 42, 2),
(11, 35, 48, 2),
(12, 36, 42, 2),
(13, 37, 48, 2),
(14, 38, 48, 2),
(15, 38, 42, 2),
(16, 39, 45, 10);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `contact_info` varchar(255) NOT NULL,
  `email` varchar(50) NOT NULL,
  `address` varchar(1000) NOT NULL,
  `notes` varchar(1000) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`supplier_id`, `name`, `company_name`, `contact_info`, `email`, `address`, `notes`, `is_active`) VALUES
(1, 'Juan Dela Cruz', 'PC Express', '09171234567', 'sales@pcexpress.com', 'Quezon City, Metro Manila', 'Trusted distributor for processors, motherboards, and GPUs.', 1),
(2, 'Maria Santos', 'Villman Computers', '09182345678', 'info@villman.com', 'Makati City, Metro Manila', 'Known for laptops and monitors.', 1),
(3, 'Pedro Reyes', 'EasyPC', '09193456789', 'support@easypc.com', 'Pasig City, Metro Manila', 'Supplies storage devices, RAM, and peripherals.', 1),
(4, 'Ana Lopez', 'Octagon Computers', '09204567891', 'contact@octagon.com', 'Cebu City', 'Handles networking, printers, and accessories.', 1),
(5, 'Mark Tan', 'Datablitz Tech', '09215678912', 'sales@datablitz.com', 'Davao City', 'Gaming laptops, GPUs, and headsets.', 1),
(8, 'dsad', 'dsa', 'dsa', 'dsa', 'd', 'ada', 1);

-- --------------------------------------------------------

--
-- Table structure for table `transactionitem`
--

CREATE TABLE `transactionitem` (
  `order_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactionitem`
--

INSERT INTO `transactionitem` (`order_id`, `transaction_id`, `product_id`, `quantity`, `price`) VALUES
(1, 1, 27, 2, 5000.00),
(2, 1, 47, 1, 5200.00),
(3, 2, 63, 1, 1.00),
(4, 3, 62, 1, 2.00),
(5, 4, 42, 1, 9200.00),
(6, 5, 42, 1, 9200.00),
(7, 6, 42, 1, 9200.00),
(8, 6, 48, 2, 3200.00),
(9, 7, 42, 1, 9200.00),
(10, 7, 48, 2, 3200.00),
(11, 8, 42, 1, 9200.00),
(12, 8, 48, 2, 3200.00),
(13, 9, 42, 1, 9200.00),
(14, 9, 48, 2, 3200.00),
(15, 10, 42, 1, 9200.00),
(16, 10, 48, 2, 3200.00),
(17, 11, 42, 1, 9200.00),
(18, 12, 42, 1, 9200.00),
(19, 13, 42, 1, 9200.00),
(20, 14, 42, 1, 9200.00),
(21, 15, 42, 3, 9200.00),
(22, 15, 48, 10, 3200.00),
(23, 16, 42, 1, 9200.00),
(24, 17, 42, 1, 9200.00),
(25, 18, 48, 1, 3200.00),
(26, 19, 48, 1, 3200.00),
(27, 20, 42, 1, 9200.00),
(28, 21, 42, 1, 9200.00),
(29, 22, 45, 2, 6400.00),
(30, 23, 45, 1, 6400.00),
(31, 24, 45, 1, 6400.00),
(32, 25, 45, 1, 6400.00),
(33, 26, 45, 1, 6400.00),
(34, 27, 45, 4, 6400.00);

-- --------------------------------------------------------

--
-- Table structure for table `unit_tbl`
--

CREATE TABLE `unit_tbl` (
  `unit_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unit_tbl`
--

INSERT INTO `unit_tbl` (`unit_id`, `name`) VALUES
(1, 'Piece'),
(2, 'Set'),
(3, 'Test');

-- --------------------------------------------------------

--
-- Table structure for table `userlogin`
--

CREATE TABLE `userlogin` (
  `user_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userlogin`
--

INSERT INTO `userlogin` (`user_id`, `staff_id`, `username`, `password_hash`, `is_active`) VALUES
(1, 1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1),
(2, 2, 'admin2', '41e5653fc7aeb894026d6bb7b2db7f65902b454945fa8fd65a6327047b5277fb', 1),
(3, 3, 'jj', '123', 1),
(4, 4, 'jj1', '$2y$10$Y0akbVy/PQWsy25cmjU6K.zfS1QROML2jcEbsIuOZ6HXUXjr2znpG', 1),
(5, 5, 'jj', '$2y$10$hK7UAeo4.VbMqfD1kF7vQ.iLpBoVlGWToS00iThJOycHeZbWkd2q6', 1),
(6, 6, 'dsad', '$2y$10$WwcUn7OKNMFrd/rIOBDpVuZ41YJzFlXMIdB6mBOd9.Rndl5g8vENW', 1),
(7, 7, 'jjj', '$2y$10$OCJDqTSDkA4FCgB8qAjLuearExJrNuHxhN10wnNGQQDP3ew8kjguC', 1),
(8, 8, 'qwe', '$2y$10$I.KgJzTfLfgyRU/OpioQoeU/46/7jfAsVCEKO0jLpGoQBFJlEPy8y', 1),
(9, 9, 'GG', '$2y$10$0RG3kyWeWFsaY6tlNNcGPehDaB40Y/x5LxNxdprM8QXearD9rsCP.', 1),
(10, 10, 'asd', '$2y$10$LWVWpQIIA5YJA8raAhi/a.QBww1v4VBXCJ4ONQaa7ZSwu4TVFT0Qe', 1),
(11, 11, 'sandykwaaa', '$2y$10$jMuUCM8qG7weWXMLNsmnd.5jr6Szm4VXleBc7PK9za.Nbwsez7hBK', 1),
(12, 12, 'admin3', '$2y$10$3lE4L0WVario7s.2iUYYy.rt8chr8oKZZ6wtWxifPTc.fq7RyVj8m', 1),
(13, 13, 'admin123', '$2y$10$pA5YkaYxx889jUxEbUdvKuZe2IZXwI3U37dscmBIbkhkoA2iIr28m', 1),
(14, 14, 'dsa', '$2y$10$gVeQ3lopC0Z6khWVLPQdAOBS5rhNjuFurlWvga7q4XBjzzCt.Dev.', 1),
(15, 15, 'sdas', '$2y$10$kN1ZVsJ0mfdeXUCBh/BRL.FY1ofvta2//XcNg/pOcgh8/vflVGvse', 1),
(16, 16, 'dsad', '$2y$10$Aa9wigf3bg5KS6CDwiux9.mJyxH7XkLGP38s5WLUDmLwkAcMBIdPy', 1),
(17, 17, 'JJ', '$2y$10$8mwUfs8BDTNaQ1VyjxDxzOTRM2TyxFaJXAcsDaqE05dXA4ZhGqxhy', 1),
(18, 18, 'JJ', '$2y$10$1E3roriiXqWTVEd2nlezZOWSH5KzULDFkYoGafA9IcO1BECYyrtNG', 1),
(19, 19, 'James', '$2y$10$SjmEk4IsNMMoADXXVXU9je.rh0kBbCSlKPZVyLR.wwEiliHbQDUIi', 1),
(20, 21, 'fds', '$2y$10$CAchgV2lOZpq2wFYdaDx/eTw.i3hcvHbqY3Qvl49Yg64B62hztrrO', 0),
(21, 22, 'dsa', '$2y$10$Rnp4a/FL8QNwhDhVoPT9reUBrdmRS/Em93ec04cqdHKU8Oj0pvjOS', 0),
(22, 23, '12345', '$2y$10$L2O0qhuvuFLd18PlvW6IEeYHuCr.hrhVBnUrRT.7p2gUGyialNqxi', 0),
(23, 24, 'warehouse1', '$2y$10$UHJOVwcQgwgrv3eVBbbYNu2zX8VTzMuYc7HlGsVL/XfxaDpE3dHTq', 1),
(24, 25, 'warehouse2', '$2y$10$03PNwKZuxC4b7hUIu9sZF.11.xaqKlOCu2d314KUAvDUCkovral/O', 1),
(25, 26, 'karel', '$2y$10$7K.Ujk9O1ZsWw6/Kamt3ROHoMmGQGQEZ1MATuxZT1NlQB5yVTfTye', 1),
(26, 27, 'paul', '$2y$10$zkRC.U.ThaYQOnkC.5H7KOH1jZl/O5U/M0EVL/A5BRVmLDxef/wli', 1),
(27, 28, 'cashier1', '$2y$10$mcA0VdBgG1H5TDDpxOMZC.w5NU4tIxttsIwXhTHVDoDasRtjSiJX.', 1),
(28, 29, 'JessieJames', '$2y$10$mupf3V7miV81qJDZfOSJgukjYZUkjFKxkh6oxMeQICK9K9hEj2Bsy', 1),
(29, 30, 'aa', '$2y$10$afw0hiDxlIbBs1WLrTTOd.eEjJ5KEvc4wy91L4vaNd9xHbZP29aXC', 1),
(30, 31, 'paul_clerk', '$2y$10$wp8rCKjP4Jk9S25IzyoW1ueAleZAaAxjovFvNLyxpU6AnIn00uT6a', 1),
(31, 32, 'store_clerk1', '$2y$10$r26pUygQdHPvWtGMm.uMKuSDhRuOCW4Ay4qW79n9/F.dffzO4Y6rC', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`brand_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `goods_received_items`
--
ALTER TABLE `goods_received_items`
  ADD PRIMARY KEY (`grn_item_id`),
  ADD KEY `grn_id` (`grn_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  ADD PRIMARY KEY (`grn_id`),
  ADD UNIQUE KEY `reference_no` (`reference_no`),
  ADD KEY `po_id` (`po_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `received_by` (`received_by`),
  ADD KEY `location_id` (`location_id`) USING BTREE,
  ADD KEY `purchase_return_id` (`purchase_return_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `product_id_2` (`product_id`,`location_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `product_id` (`product_id`) USING BTREE;

--
-- Indexes for table `location`
--
ALTER TABLE `location`
  ADD PRIMARY KEY (`location_id`);

--
-- Indexes for table `pos_terminal`
--
ALTER TABLE `pos_terminal`
  ADD PRIMARY KEY (`terminal_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `brand_id` (`brand_id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `product_supplier`
--
ALTER TABLE `product_supplier`
  ADD PRIMARY KEY (`product_supplier_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD PRIMARY KEY (`po_id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `created_by` (`created_by`) USING BTREE,
  ADD KEY `location_id` (`location_id`) USING BTREE;

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`po_item_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `po_id` (`po_id`) USING BTREE;

--
-- Indexes for table `purchase_return`
--
ALTER TABLE `purchase_return`
  ADD PRIMARY KEY (`purchase_return_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  ADD PRIMARY KEY (`purchase_return_items_id`),
  ADD KEY `purchase_return_id` (`purchase_return_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `salestransaction`
--
ALTER TABLE `salestransaction`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `sales_return`
--
ALTER TABLE `sales_return`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  ADD PRIMARY KEY (`return_item_id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `shift`
--
ALTER TABLE `shift`
  ADD PRIMARY KEY (`shift_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `warehouse_id` (`location_id`);

--
-- Indexes for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD PRIMARY KEY (`adjustment_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approve_by` (`approve_by`),
  ADD KEY `location_id` (`location_id`) USING BTREE;

--
-- Indexes for table `stock_adjustment_items`
--
ALTER TABLE `stock_adjustment_items`
  ADD PRIMARY KEY (`adjustment_item_id`),
  ADD KEY `adjustment_id` (`adjustment_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`movement_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `location_id` (`location_id`);

--
-- Indexes for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  ADD PRIMARY KEY (`stock_transfer_id`),
  ADD KEY `from_location_id` (`from_location_id`),
  ADD KEY `to_location_id` (`to_location_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `requested_by` (`requested_by`) USING BTREE;

--
-- Indexes for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD PRIMARY KEY (`stock_transfer_item_id`),
  ADD KEY `stock_transfer_id` (`stock_transfer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `transactionitem`
--
ALTER TABLE `transactionitem`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `unit_tbl`
--
ALTER TABLE `unit_tbl`
  ADD PRIMARY KEY (`unit_id`);

--
-- Indexes for table `userlogin`
--
ALTER TABLE `userlogin`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brand`
--
ALTER TABLE `brand`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `goods_received_items`
--
ALTER TABLE `goods_received_items`
  MODIFY `grn_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  MODIFY `grn_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `location`
--
ALTER TABLE `location`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pos_terminal`
--
ALTER TABLE `pos_terminal`
  MODIFY `terminal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `product_supplier`
--
ALTER TABLE `product_supplier`
  MODIFY `product_supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `purchase_order`
--
ALTER TABLE `purchase_order`
  MODIFY `po_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `po_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=199;

--
-- AUTO_INCREMENT for table `purchase_return`
--
ALTER TABLE `purchase_return`
  MODIFY `purchase_return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  MODIFY `purchase_return_items_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `salestransaction`
--
ALTER TABLE `salestransaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `sales_return`
--
ALTER TABLE `sales_return`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  MODIFY `return_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `shift`
--
ALTER TABLE `shift`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=441;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `adjustment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `stock_adjustment_items`
--
ALTER TABLE `stock_adjustment_items`
  MODIFY `adjustment_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `movement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  MODIFY `stock_transfer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  MODIFY `stock_transfer_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `transactionitem`
--
ALTER TABLE `transactionitem`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `unit_tbl`
--
ALTER TABLE `unit_tbl`
  MODIFY `unit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `userlogin`
--
ALTER TABLE `userlogin`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `goods_received_items`
--
ALTER TABLE `goods_received_items`
  ADD CONSTRAINT `goods_received_items_ibfk_1` FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes` (`grn_id`),
  ADD CONSTRAINT `goods_received_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `goods_received_notes`
--
ALTER TABLE `goods_received_notes`
  ADD CONSTRAINT `goods_received_notes_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`),
  ADD CONSTRAINT `goods_received_notes_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `goods_received_notes_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `goods_received_notes_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `goods_received_notes_ibfk_5` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_return` (`purchase_return_id`);

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brand` (`brand_id`),
  ADD CONSTRAINT `product_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  ADD CONSTRAINT `product_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`unit_id`),
  ADD CONSTRAINT `product_ibfk_7` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `product_ibfk_8` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `product_supplier`
--
ALTER TABLE `product_supplier`
  ADD CONSTRAINT `product_supplier_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `product_supplier_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD CONSTRAINT `purchase_order_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `purchase_order_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `purchase_order_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`),
  ADD CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `purchase_return`
--
ALTER TABLE `purchase_return`
  ADD CONSTRAINT `purchase_return_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `purchase_return_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`);

--
-- Constraints for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  ADD CONSTRAINT `purchase_return_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `purchase_return_items_ibfk_2` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_return` (`purchase_return_id`);

--
-- Constraints for table `salestransaction`
--
ALTER TABLE `salestransaction`
  ADD CONSTRAINT `salestransaction_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `salestransaction_ibfk_4` FOREIGN KEY (`terminal_id`) REFERENCES `pos_terminal` (`terminal_id`);

--
-- Constraints for table `sales_return`
--
ALTER TABLE `sales_return`
  ADD CONSTRAINT `sales_return_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `salestransaction` (`transaction_id`),
  ADD CONSTRAINT `sales_return_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  ADD CONSTRAINT `sales_return_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `sales_return_items_ibfk_2` FOREIGN KEY (`return_id`) REFERENCES `sales_return` (`return_id`);

--
-- Constraints for table `shift`
--
ALTER TABLE `shift`
  ADD CONSTRAINT `shift_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`);

--
-- Constraints for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `stock_adjustments_ibfk_3` FOREIGN KEY (`approve_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `stock_adjustment_items`
--
ALTER TABLE `stock_adjustment_items`
  ADD CONSTRAINT `stock_adjustment_items_ibfk_1` FOREIGN KEY (`adjustment_id`) REFERENCES `stock_adjustments` (`adjustment_id`),
  ADD CONSTRAINT `stock_adjustment_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `stock_transfer`
--
ALTER TABLE `stock_transfer`
  ADD CONSTRAINT `stock_transfer_ibfk_2` FOREIGN KEY (`from_location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `stock_transfer_ibfk_4` FOREIGN KEY (`requested_by`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `stock_transfer_ibfk_5` FOREIGN KEY (`to_location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `stock_transfer_ibfk_6` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD CONSTRAINT `stock_transfer_items_ibfk_1` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfer` (`stock_transfer_id`),
  ADD CONSTRAINT `stock_transfer_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `transactionitem`
--
ALTER TABLE `transactionitem`
  ADD CONSTRAINT `transactionitem_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `salestransaction` (`transaction_id`),
  ADD CONSTRAINT `transactionitem_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `userlogin`
--
ALTER TABLE `userlogin`
  ADD CONSTRAINT `userlogin_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
