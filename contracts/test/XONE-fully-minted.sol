// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@faircrypto/xen-crypto/contracts/XENCrypto.sol";
import "@faircrypto/xenft/contracts/XENFT.sol";
import "@faircrypto/vmpx/contracts/VMPX.sol";
import "@faircrypto/xenft/contracts/libs/MintInfo.sol";

contract XONEFullyMinted is
    Ownable,
    IBurnableToken,
    ERC20("XONE", "XONE Token Fully Minted"),
    ERC20Capped(2_500_000 ether)
{

    using MintInfo for uint256;

    // address public constant XEN_ADDRESS = 0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8;
    // address public constant XENFT_ADDRESS = 0x0a252663DBCc0b073063D6420a40319e438Cfa59;
    // address public constant VMPX_ADDRESS = ???;

    uint256 public constant BATCH_FLOOR = 1_000 ether;
    uint256 public constant BATCH_XEN_1M = 10_000 ether;
    uint256 public constant BATCH_XEN_BURN_1M = 10_000 ether;
    uint256 public constant BATCH_VMPX_100 = 10_000 ether;
    uint256 public constant BATCH_COLLECTOR_XENFT = 12_000 ether;
    uint256 public constant BATCH_LIMITED_XENFT = 15_000 ether;
    uint256 public constant BATCH_APEX_RARE_XENFT = 20_000 ether;
    uint256 public constant BATCH_APEX_EPIC_XENFT = 30_000 ether;
    uint256 public constant BATCH_APEX_LEGENDARY_XENFT = 50_000 ether;
    uint256 public constant BATCH_APEX_EXOTIC_XENFT = 100_000 ether;
    uint256 public constant BATCH_APEX_XUNICORN_XENFT = 1_000_000 ether;

    uint256 public constant START_TRANSFER_MARGIN = 100_000 ether;

    uint256 public constant XEN_THRESHOLD = 1_000_000 ether - 1 ether;
    uint256 public constant VMPX_THRESHOLD = 100 ether - 1 ether;

    uint256 public constant XONE_MIN_BURN = 0;

    XENCrypto public immutable xenCrypto;
    XENTorrent public immutable xenTorrent;
    VMPX public immutable vmpx;
    uint256  public immutable startBlockNumber;

    bool public mintingFinished = true;

    mapping(address => uint256) public userBurns;

    constructor(
        address xenCryptoAddress,
        address xenTorrentAddress,
        address vmpxAddress,
        uint256 startBlockNumber_
    ) {
        xenCrypto = XENCrypto(xenCryptoAddress);
        xenTorrent = XENTorrent(xenTorrentAddress);
        vmpx = VMPX(vmpxAddress);
        startBlockNumber = startBlockNumber_;
        _mint(owner(), cap());
    }

    modifier notBeforeStart() {
        require(block.number > startBlockNumber, "XONE: Not active yet");
        _;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(mintingFinished || from == address(0), "XONE: minting not finished");
        super._beforeTokenTransfer(from, to, amount);
    }

    function _hasXEN() internal view returns (bool) {
        return ERC20(address(xenCrypto)).balanceOf(_msgSender()) > XEN_THRESHOLD;
    }

    function _hasXENBurns() internal view returns (bool) {
        return xenCrypto.userBurns(_msgSender()) > XEN_THRESHOLD;
    }

    function _hasVMPX() internal view returns (bool) {
        return ERC20(address(vmpx)).balanceOf(_msgSender()) > VMPX_THRESHOLD;
    }

    function _hasXeNFT() internal view returns (bool) {
        return ERC721(address(xenTorrent)).balanceOf(_msgSender()) > 0;
    }

    function _getXenftBatch(uint256 tokenId) internal view returns (uint256 batch) {
        require(xenTorrent.ownerOf(tokenId) == _msgSender(), "XONE: not owner");
        uint256 mintInfo = xenTorrent.mintInfo(tokenId);
        batch = BATCH_COLLECTOR_XENFT;
        (, bool apex, bool limited) = mintInfo.getClass();
        if (apex) {
            if (tokenId < xenTorrent.specialClassesTokenLimits(6)) {
                if (BATCH_APEX_XUNICORN_XENFT > batch) {
                    batch = BATCH_APEX_XUNICORN_XENFT;
                }
            } else if (tokenId < xenTorrent.specialClassesTokenLimits(5)) {
                if (BATCH_APEX_EXOTIC_XENFT > batch) {
                    batch = BATCH_APEX_EXOTIC_XENFT;
                }
            } else if (tokenId < xenTorrent.specialClassesTokenLimits(4)) {
                if (BATCH_APEX_LEGENDARY_XENFT > batch) {
                    batch = BATCH_APEX_LEGENDARY_XENFT;
                }
            } else if (tokenId < xenTorrent.specialClassesTokenLimits(3)) {
                if (BATCH_APEX_EPIC_XENFT > batch) {
                    batch = BATCH_APEX_EPIC_XENFT;
                }
            } else if (tokenId < xenTorrent.specialClassesTokenLimits(2)) {
                if (BATCH_APEX_RARE_XENFT > batch) {
                    batch = BATCH_APEX_RARE_XENFT;
                }
            }
        } else if (limited && BATCH_LIMITED_XENFT > batch) {
            batch = BATCH_LIMITED_XENFT;
        }
    }

    function _getBatch(uint256 tokenId) internal view returns (uint256 batch) {
        if (_hasXeNFT()) {
            batch = _getXenftBatch(tokenId);
        } else if (_hasXENBurns()) {
            batch = BATCH_XEN_BURN_1M;
        } else if (_hasXEN()) {
            batch = BATCH_XEN_1M;
        } else if (_hasVMPX()) {
            batch = BATCH_VMPX_100;
        } else {
            batch = BATCH_FLOOR;
        }
    }

    function _mint(address account, uint256 amount) internal virtual override (ERC20, ERC20Capped) {
        super._mint(account, amount);
    }

    function mint(uint256 tokenId) external notBeforeStart {
        uint256 batch = _getBatch(tokenId);
        require(totalSupply() + batch <= cap(), "XONE: minting exceeds cap");
        _mint(_msgSender(), batch);
        if (!mintingFinished && cap() - totalSupply() < START_TRANSFER_MARGIN) {
            mintingFinished = true;
        }
    }

    function burn(address user, uint256 amount) public {
        require(amount > XONE_MIN_BURN, "XONE: Below min limit");
        require(
            IERC165(_msgSender()).supportsInterface(type(IBurnRedeemable).interfaceId),
            "XONE: not a supported contract"
        );

        _spendAllowance(user, _msgSender(), amount);
        _burn(user, amount);
        userBurns[user] += amount;
        IBurnRedeemable(_msgSender()).onTokenBurned(user, amount);
    }
}